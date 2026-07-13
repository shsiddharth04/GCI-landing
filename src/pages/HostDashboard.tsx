import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { supabase } from "../lib/supabase";
import { ArtistWithProfile, HostProfile } from "../types/dashboard";
import DashboardHeader from "../components/dashboard/DashboardHeader";
import FilterBar from "../components/dashboard/FilterBar";
import ArtistCard from "../components/dashboard/ArtistCard";
import ArtistDetailModal from "../components/dashboard/ArtistDetailModal";

function CardSkeleton() {
  return (
    <div className="bg-zinc-950 border border-zinc-800/80 rounded-3xl overflow-hidden animate-pulse">
      <div className="w-full aspect-[4/3] bg-zinc-900" />
      <div className="p-5 flex flex-col gap-3">
        <div className="h-5 bg-zinc-800 rounded-full w-2/3" />
        <div className="flex gap-2">
          <div className="h-6 bg-zinc-800 rounded-full w-16" />
          <div className="h-6 bg-zinc-800 rounded-full w-20" />
        </div>
        <div className="h-4 bg-zinc-800/60 rounded-full w-full" />
        <div className="h-4 bg-zinc-800/60 rounded-full w-4/5" />
        <div className="flex justify-between pt-3 border-t border-zinc-900">
          <div className="h-4 bg-zinc-800 rounded-full w-24" />
          <div className="h-4 bg-zinc-800 rounded-full w-20" />
        </div>
      </div>
    </div>
  );
}

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center mb-4">
        <span className="text-3xl">🎵</span>
      </div>
      <h3 className="text-lg font-bold text-white mb-2">
        {hasFilters ? "No artists match these filters" : "No artists yet"}
      </h3>
      <p className="text-sm text-zinc-500 max-w-xs leading-relaxed">
        {hasFilters
          ? "Try removing some filters to see more artists."
          : "Artists who join Gig Culture India will appear here. Check back soon."}
      </p>
    </div>
  );
}

export default function HostDashboard() {
  const navigate = useNavigate();
  const [host, setHost] = useState<HostProfile | null>(null);
  const [artists, setArtists] = useState<ArtistWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArtist, setSelectedArtist] = useState<ArtistWithProfile | null>(null);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }

      // Load host profile
      const { data: hostData } = await supabase
        .from("hosts")
        .select("id, spotify_id, profiles(full_name)")
        .eq("id", session.user.id)
        .single();

      if (!hostData) { navigate("/auth?role=host"); return; }

      if (!cancelled) setHost(hostData as unknown as HostProfile);

      // Load all artists with their profiles
      const { data: artistData } = await supabase
        .from("artists")
        .select("*, profiles(full_name, avatar_url)");

      if (cancelled) return;

      let enriched: ArtistWithProfile[] = (artistData || []) as unknown as ArtistWithProfile[];

      // If host has Spotify connected, fetch match scores
      if (hostData.spotify_id) {
        const { data: matchData } = await supabase
          .from("matches")
          .select("artist_id, match_score")
          .in("event_id",
            // Fetch from events belonging to this host
            (await supabase.from("events").select("id").eq("host_id", session.user.id)).data?.map(e => e.id) || []
          );

        if (matchData && matchData.length > 0) {
          const scoreMap: Record<string, number> = {};
          matchData.forEach((m) => {
            if (scoreMap[m.artist_id] == null || m.match_score > scoreMap[m.artist_id]) {
              scoreMap[m.artist_id] = m.match_score;
            }
          });
          enriched = enriched.map((a) => ({ ...a, match_score: scoreMap[a.id] ?? null }));
        }
      }

      if (!cancelled) {
        setArtists(enriched);
        setLoading(false);
      }
    };

    init();
    return () => { cancelled = true; };
  }, [navigate]);

  // Derive filter options from data
  const allGenres = useMemo(() => {
    const set = new Set<string>();
    artists.forEach((a) => (a.genres || []).forEach((g) => set.add(g)));
    return Array.from(set).sort();
  }, [artists]);

  const allCities = useMemo(() => {
    const set = new Set<string>();
    artists.forEach((a) => (a.performance_cities || []).forEach((c) => set.add(c)));
    return Array.from(set).sort();
  }, [artists]);

  const filteredArtists = useMemo(() => {
    return artists.filter((a) => {
      const genreMatch =
        selectedGenres.length === 0 ||
        selectedGenres.some((g) => (a.genres || []).includes(g));
      const cityMatch =
        selectedCity === null ||
        (a.performance_cities || []).includes(selectedCity);
      return genreMatch && cityMatch;
    });
  }, [artists, selectedGenres, selectedCity]);

  const handleGenreToggle = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  const handleRequestBooking = (artist: ArtistWithProfile) => {
    // Booking flow — to be built next
    alert(`Booking flow for ${artist.profiles?.full_name} coming soon!`);
  };

  const hasFilters = selectedGenres.length > 0 || selectedCity !== null;

  return (
    <div className="min-h-screen bg-[#070708] text-white antialiased">
      {/* Ambient background blobs */}
      <div className="fixed top-1/4 left-[-200px] w-[600px] h-[600px] bg-[#CBA6F7]/6 rounded-full blur-[130px] pointer-events-none z-0" />
      <div className="fixed bottom-1/4 right-[-200px] w-[500px] h-[500px] bg-purple-700/8 rounded-full blur-[120px] pointer-events-none z-0" />

      <DashboardHeader
        hostName={host?.profiles?.full_name ?? null}
        hasSpotify={!!host?.spotify_id}
      />

      <FilterBar
        allGenres={allGenres}
        allCities={allCities}
        selectedGenres={selectedGenres}
        selectedCity={selectedCity}
        onGenreToggle={handleGenreToggle}
        onCitySelect={setSelectedCity}
        onClearAll={() => { setSelectedGenres([]); setSelectedCity(null); }}
        resultCount={filteredArtists.length}
      />

      <main className="max-w-7xl mx-auto px-6 py-10 relative z-10">
        {/* Page title */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Artist Roster</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Browse and book independent artists curated for live events.
            {!host?.spotify_id && (
              <span className="text-[#CBA6F7] ml-1">
                Connect Spotify to unlock AI match scores.
              </span>
            )}
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)
          ) : filteredArtists.length === 0 ? (
            <EmptyState hasFilters={hasFilters} />
          ) : (
            filteredArtists.map((artist, i) => (
              <motion.div
                key={artist.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
              >
                <ArtistCard
                  artist={artist}
                  onClick={() => setSelectedArtist(artist)}
                />
              </motion.div>
            ))
          )}
        </div>
      </main>

      <ArtistDetailModal
        artist={selectedArtist}
        onClose={() => setSelectedArtist(null)}
        onRequestBooking={handleRequestBooking}
      />
    </div>
  );
}
