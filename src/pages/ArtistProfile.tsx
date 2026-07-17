import { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate, Link } from "react-router-dom";
import { motion } from "motion/react";
import {
  ArrowLeft, MapPin, IndianRupee, ShieldCheck, Music,
  Instagram, Youtube, Twitter, ExternalLink, Navigation, Clock, Mic2, Play,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { ArtistWithProfile, ArtistMedia, getDisplayName } from "../types/dashboard";

function MatchGauge({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.4, duration: 0.5 }}
      className="relative w-28 h-28 shrink-0"
    >
      <svg width="112" height="112" viewBox="0 0 112 112" className="rotate-[-90deg]">
        <circle cx="56" cy="56" r={radius} fill="none" stroke="#27272a" strokeWidth="7" />
        <motion.circle
          cx="56" cy="56" r={radius}
          fill="none"
          stroke="url(#gaugeGrad)"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.6 }}
        />
        <defs>
          <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#CBA6F7" />
            <stop offset="100%" stopColor="#89b4fa" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-black text-white leading-none">{pct}</span>
        <span className="text-[9px] text-[#CBA6F7] font-bold tracking-widest uppercase mt-0.5">Match</span>
      </div>
    </motion.div>
  );
}

function SoundCloudEmbed({ url, isPlaylist }: { url: string; isPlaylist: boolean }) {
  const embedUrl = `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%23CBA6F7&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false${isPlaylist ? "&show_artwork=true" : "&visual=true"}`;
  return (
    <iframe
      width="100%"
      height={isPlaylist ? "450" : "300"}
      scrolling="no"
      frameBorder="no"
      allow="autoplay"
      src={embedUrl}
      className="rounded-2xl overflow-hidden"
      title="SoundCloud player"
    />
  );
}

function AvatarPlaceholder({ name }: { name: string }) {
  const initial = name?.charAt(0)?.toUpperCase() || "A";
  const colors = ["from-purple-600 to-[#CBA6F7]", "from-blue-600 to-purple-500", "from-pink-600 to-purple-500", "from-indigo-600 to-blue-400", "from-violet-600 to-pink-400"];
  const color = colors[initial.charCodeAt(0) % colors.length];
  return (
    <div className={`w-full h-full bg-gradient-to-br ${color} flex items-center justify-center`}>
      <span className="text-[20vw] font-black text-white/20 select-none">{initial}</span>
    </div>
  );
}

function formatDuration(mins: number) {
  if (mins < 60) return `${mins} min`;
  if (mins === 60) return "1 hr";
  if (mins === 90) return "1.5 hr";
  if (mins === 120) return "2 hr";
  return `${mins} min`;
}

export default function ArtistProfile() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [artist, setArtist] = useState<ArtistWithProfile | null>(null);
  const [media, setMedia] = useState<ArtistMedia[]>([]);
  const [loading, setLoading] = useState(true);

  const matchPct = searchParams.get("match") ? Number(searchParams.get("match")) / 100 : null;

  useEffect(() => {
    if (!id) return;
    supabase
      .from("artists")
      .select("*, profiles(full_name, avatar_url)")
      .eq("id", id)
      .single()
      .then(({ data }) => {
        setArtist(data as unknown as ArtistWithProfile);
        setLoading(false);
      });

    supabase
      .from("artist_media")
      .select("*")
      .eq("artist_id", id)
      .order("display_order")
      .then(({ data }) => setMedia((data as ArtistMedia[]) || []));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070708] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#CBA6F7]/30 border-t-[#CBA6F7] rounded-full animate-spin" />
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="min-h-screen bg-[#070708] flex flex-col items-center justify-center gap-4 text-white">
        <p className="text-zinc-400">Artist not found.</p>
        <button onClick={() => navigate(-1)} className="text-[#CBA6F7] text-sm hover:underline">Go back</button>
      </div>
    );
  }

  const name = getDisplayName(artist);
  const photo = artist.avatar_url || artist.profiles?.avatar_url;
  const social = (artist.social_links || {}) as Record<string, string>;
  const playlistUrl = artist.soundcloud_playlist_url;
  const profileUrl = artist.soundcloud_url;
  const embedUrl = playlistUrl || profileUrl;
  const isPlaylist = !!(playlistUrl || (profileUrl && profileUrl.includes("/sets/")));

  return (
    <div className="min-h-screen bg-[#070708] text-white antialiased">

      {/* ── HERO ─────────────────────────────────────────── */}
      <div className="relative w-full h-[92vh] overflow-hidden">
        {/* Background photo */}
        {photo ? (
          <img src={photo} alt={name} className="absolute inset-0 w-full h-full object-cover object-top scale-105" />
        ) : (
          <div className="absolute inset-0"><AvatarPlaceholder name={name} /></div>
        )}

        {/* Gradient layers */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#070708] via-[#070708]/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#070708]/60 via-transparent to-transparent" />

        {/* Top nav */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-6 z-10">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2.5 bg-black/40 backdrop-blur-md border border-white/10 rounded-full text-white text-sm font-medium hover:bg-black/60 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <Link to="/" className="flex items-center gap-2 px-4 py-2.5 bg-black/40 backdrop-blur-md border border-white/10 rounded-full">
            <Music className="h-4 w-4 text-[#CBA6F7]" />
            <span className="text-xs font-black uppercase tracking-widest text-white">GCI</span>
          </Link>
        </div>

        {/* Bottom content */}
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-10 z-10">
          <div className="max-w-7xl mx-auto flex items-end justify-between gap-8">
            <div className="flex-1 min-w-0">
              {/* Verified + genre row */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {artist.onboarding_complete && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-black/50 backdrop-blur-md border border-[#CBA6F7]/30 rounded-full">
                    <ShieldCheck className="h-3.5 w-3.5 text-[#CBA6F7]" />
                    <span className="text-xs font-bold text-[#CBA6F7] uppercase tracking-wider">Verified Artist</span>
                  </div>
                )}
                {(artist.genres || []).slice(0, 3).map((g) => (
                  <span key={g} className="px-3 py-1.5 bg-black/40 backdrop-blur-md border border-white/15 text-white/80 text-xs font-semibold rounded-full">
                    {g}
                  </span>
                ))}
              </div>

              {/* Name */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-5xl sm:text-7xl font-black text-white tracking-tight leading-none mb-3"
                style={{ textShadow: "0 2px 40px rgba(0,0,0,0.8)" }}
              >
                {name}
              </motion.h1>

              {/* Location */}
              {artist.location && (
                <div className="flex items-center gap-1.5 text-zinc-300 text-sm">
                  <MapPin className="h-4 w-4 text-[#CBA6F7]" />
                  <span>{artist.location}</span>
                </div>
              )}
            </div>

            {/* Match gauge */}
            {matchPct != null && (
              <div className="shrink-0 hidden sm:block">
                <MatchGauge score={matchPct} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── STATS BAR ────────────────────────────────────── */}
      <div className="border-y border-zinc-800/80 bg-zinc-950/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-wrap gap-x-8 gap-y-3">
          {artist.base_rate != null && (
            <div className="flex items-center gap-2">
              <IndianRupee className="h-4 w-4 text-[#CBA6F7]" />
              <div>
                <p className="text-white font-black text-base leading-none">
                  ₹{Number(artist.base_rate).toLocaleString("en-IN")}
                </p>
                <p className="text-zinc-500 text-[11px] mt-0.5">base rate</p>
              </div>
            </div>
          )}
          {(artist.set_durations || []).length > 0 && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#CBA6F7]" />
              <div>
                <p className="text-white font-black text-base leading-none">
                  {artist.set_durations.map(formatDuration).join(" · ")}
                </p>
                <p className="text-zinc-500 text-[11px] mt-0.5">set durations</p>
              </div>
            </div>
          )}
          {(artist.event_types || []).length > 0 && (
            <div className="flex items-center gap-2">
              <Mic2 className="h-4 w-4 text-[#CBA6F7]" />
              <div>
                <p className="text-white font-black text-base leading-none">
                  {artist.event_types.slice(0, 3).join(" · ")}
                  {artist.event_types.length > 3 && ` +${artist.event_types.length - 3}`}
                </p>
                <p className="text-zinc-500 text-[11px] mt-0.5">event types</p>
              </div>
            </div>
          )}
          {matchPct != null && (
            <div className="flex items-center gap-2 sm:hidden">
              <div className="w-2 h-2 rounded-full bg-[#CBA6F7] shadow-[0_0_6px_rgba(203,166,247,0.8)]" />
              <div>
                <p className="text-white font-black text-base leading-none">{Math.round(matchPct * 100)}%</p>
                <p className="text-zinc-500 text-[11px] mt-0.5">AI match</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── MAIN CONTENT ─────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 py-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

          {/* LEFT — About, genres, vibes, cities, social */}
          <div className="lg:col-span-5 flex flex-col gap-10">

            {/* About */}
            {artist.bio && (
              <div>
                <p className="text-[11px] text-zinc-600 uppercase tracking-widest font-bold mb-3">About</p>
                <p className="text-zinc-300 leading-relaxed text-base">{artist.bio}</p>
              </div>
            )}

            {/* Genres */}
            {(artist.genres || []).length > 0 && (
              <div>
                <p className="text-[11px] text-zinc-600 uppercase tracking-widest font-bold mb-3">Genres</p>
                <div className="flex flex-wrap gap-2">
                  {artist.genres.map((g) => (
                    <span key={g} className="px-3.5 py-2 bg-[#CBA6F7]/10 border border-[#CBA6F7]/25 text-[#CBA6F7] text-sm font-semibold rounded-full">
                      {g}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Vibes */}
            {(artist.vibe_tags || []).length > 0 && (
              <div>
                <p className="text-[11px] text-zinc-600 uppercase tracking-widest font-bold mb-3">Vibe</p>
                <div className="flex flex-wrap gap-2">
                  {artist.vibe_tags.map((v) => (
                    <span key={v} className="px-3.5 py-2 bg-zinc-900 border border-zinc-700/60 text-zinc-300 text-sm font-medium rounded-full">
                      {v}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Performance cities */}
            {(artist.performance_cities || []).length > 0 && (
              <div>
                <p className="text-[11px] text-zinc-600 uppercase tracking-widest font-bold mb-3">Performs in</p>
                <div className="flex flex-wrap gap-2">
                  {artist.performance_cities.map((city) => (
                    <div key={city} className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900/80 border border-zinc-800 rounded-full text-sm text-zinc-300 font-medium">
                      <Navigation className="h-3 w-3 text-zinc-500" />
                      {city}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Social links */}
            {(artist.soundcloud_url || social.instagram || social.youtube || social.twitter) && (
              <div>
                <p className="text-[11px] text-zinc-600 uppercase tracking-widest font-bold mb-3">Links</p>
                <div className="flex flex-wrap gap-2">
                  {artist.soundcloud_url && (
                    <a href={artist.soundcloud_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold rounded-full hover:bg-orange-500/20 transition-colors">
                      <ExternalLink className="h-3.5 w-3.5" />SoundCloud
                    </a>
                  )}
                  {social.instagram && (
                    <a href={social.instagram} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs font-semibold rounded-full hover:text-white transition-colors">
                      <Instagram className="h-3.5 w-3.5" />Instagram
                    </a>
                  )}
                  {social.youtube && (
                    <a href={social.youtube} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs font-semibold rounded-full hover:text-white transition-colors">
                      <Youtube className="h-3.5 w-3.5" />YouTube
                    </a>
                  )}
                  {social.twitter && (
                    <a href={social.twitter} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs font-semibold rounded-full hover:text-white transition-colors">
                      <Twitter className="h-3.5 w-3.5" />Twitter
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT — SoundCloud + booking */}
          <div className="lg:col-span-7 flex flex-col gap-8">

            {/* SoundCloud player */}
            {embedUrl && (
              <div>
                <p className="text-[11px] text-zinc-600 uppercase tracking-widest font-bold mb-4">
                  {isPlaylist ? "Playlist" : "Music"}
                </p>
                <div className="rounded-2xl overflow-hidden border border-zinc-800/80 bg-zinc-950">
                  <SoundCloudEmbed url={embedUrl} isPlaylist={isPlaylist} />
                </div>
              </div>
            )}

            {/* Booking card */}
            <div className="bg-zinc-950 border border-zinc-800/80 rounded-3xl p-8 flex flex-col gap-6 sticky top-8">
              <div>
                <p className="text-[11px] text-zinc-600 uppercase tracking-widest font-bold mb-4">Book this artist</p>
                {artist.base_rate != null && (
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-4xl font-black text-white">
                      ₹{Number(artist.base_rate).toLocaleString("en-IN")}
                    </span>
                    <span className="text-zinc-500 text-sm">/ show</span>
                  </div>
                )}
                <p className="text-zinc-600 text-xs">Starting rate · final price negotiated per event</p>
              </div>

              {(artist.set_durations || []).length > 0 && (
                <div>
                  <p className="text-xs text-zinc-600 font-semibold uppercase tracking-wider mb-2">Set options</p>
                  <div className="flex flex-wrap gap-2">
                    {artist.set_durations.map((d) => (
                      <span key={d} className="px-3 py-1.5 bg-zinc-900 border border-zinc-700 rounded-full text-xs text-zinc-300 font-medium">
                        {formatDuration(d)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {(artist.event_types || []).length > 0 && (
                <div>
                  <p className="text-xs text-zinc-600 font-semibold uppercase tracking-wider mb-2">Available for</p>
                  <div className="flex flex-wrap gap-2">
                    {artist.event_types.map((et) => (
                      <span key={et} className="px-3 py-1.5 bg-zinc-900 border border-zinc-700 rounded-full text-xs text-zinc-300 font-medium">
                        {et}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-4 bg-[#CBA6F7] hover:bg-[#b58ce6] text-black font-black text-base rounded-2xl shadow-[0_4px_24px_rgba(203,166,247,0.4)] transition-all duration-300 cursor-pointer"
              >
                Request Booking
              </motion.button>

              <div className="flex items-center gap-2 text-xs text-zinc-600">
                <ShieldCheck className="h-3.5 w-3.5 text-[#CBA6F7]/60 shrink-0" />
                <span>Booking protected by an automated, legally binding contract.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── MEDIA GALLERY ────────────────────────────────── */}
      {media.length > 0 && (
        <div className="max-w-7xl mx-auto px-6 pb-20">
          <p className="text-[11px] text-zinc-600 uppercase tracking-widest font-bold mb-6">From the stage</p>
          <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 space-y-3">
            {media.map((item) =>
              item.media_type === "photo" ? (
                <div key={item.id} className="break-inside-avoid rounded-2xl overflow-hidden border border-zinc-800/60 bg-zinc-950">
                  <img src={item.url} alt={item.caption || ""} className="w-full object-cover" loading="lazy" />
                  {item.caption && <p className="px-3 py-2 text-xs text-zinc-500">{item.caption}</p>}
                </div>
              ) : (
                <div key={item.id} className="break-inside-avoid rounded-2xl overflow-hidden border border-zinc-800/60 bg-zinc-950 relative group">
                  <video src={item.url} className="w-full" preload="metadata" controls={false} />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/20 transition-colors">
                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <Play className="h-5 w-5 text-white fill-white" />
                    </div>
                  </div>
                  <video src={item.url} className="w-full hidden" controls />
                  {item.caption && <p className="px-3 py-2 text-xs text-zinc-500">{item.caption}</p>}
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}
