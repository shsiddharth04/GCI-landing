import React, { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate, Link } from "react-router-dom";
import { motion } from "motion/react";
import {
  ArrowLeft, MapPin, IndianRupee, ShieldCheck, Music,
  Instagram, Youtube, Twitter, ExternalLink, Navigation,
  Clock, Mic2, Play, CheckCircle,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { ArtistWithProfile, ArtistMedia, getDisplayName, getAccentColor } from "../types/dashboard";

function SoundCloudEmbed({ url, isPlaylist }: { url: string; isPlaylist: boolean }) {
  const src = `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%23CBA6F7&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false${isPlaylist ? "&show_artwork=true" : "&visual=true"}`;
  return (
    <iframe
      width="100%"
      height={isPlaylist ? "360" : "260"}
      scrolling="no"
      frameBorder="no"
      allow="autoplay"
      src={src}
      className="block w-full"
      title="SoundCloud player"
    />
  );
}

function formatDuration(mins: number): string {
  if (mins < 60) return `${mins}m`;
  if (mins % 60 === 0) return `${mins / 60}h`;
  return `${Math.floor(mins / 60)}h${mins % 60}m`;
}

function AvatarFallback({ name, accent }: { name: string; accent: string }) {
  return (
    <div
      className="w-full h-full flex items-center justify-center"
      style={{ background: `linear-gradient(135deg, #111113 0%, ${accent}20 100%)` }}
    >
      <span
        className="font-bold select-none"
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: "8rem",
          color: `${accent}28`,
          lineHeight: 1,
        }}
      >
        {name?.charAt(0)?.toUpperCase() || "A"}
      </span>
    </div>
  );
}

export default function ArtistProfile() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [artist, setArtist] = useState<ArtistWithProfile | null>(null);
  const [media, setMedia] = useState<ArtistMedia[]>([]);
  const [completedGigs, setCompletedGigs] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const matchRaw = searchParams.get("match");
  const matchPct = matchRaw != null ? Math.round(Number(matchRaw)) : null;

  useEffect(() => {
    if (!id) return;
    Promise.all([
      supabase.from("artists").select("*, profiles(full_name, avatar_url)").eq("id", id).single(),
      supabase.from("artist_media").select("*").eq("artist_id", id).order("display_order"),
      supabase.from("bookings").select("*", { count: "exact", head: true }).eq("artist_id", id).eq("status", "completed"),
    ]).then(([artistRes, mediaRes, gigsRes]) => {
      setArtist(artistRes.data as unknown as ArtistWithProfile);
      setMedia((mediaRes.data as ArtistMedia[]) || []);
      setCompletedGigs(gigsRes.count ?? 0);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070708] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 animate-spin"
          style={{ borderColor: "rgba(203,166,247,0.2)", borderTopColor: "#CBA6F7" }} />
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="min-h-screen bg-[#070708] flex flex-col items-center justify-center gap-4">
        <p className="text-zinc-400">Artist not found.</p>
        <button onClick={() => navigate(-1)} className="text-[#CBA6F7] text-sm hover:underline cursor-pointer">
          Go back
        </button>
      </div>
    );
  }

  const name = getDisplayName(artist);
  const photo = artist.avatar_url || artist.profiles?.avatar_url;
  const accent = getAccentColor(artist.genres);
  const social = (artist.social_links || {}) as Record<string, string>;
  const embedUrl = artist.soundcloud_playlist_url || artist.soundcloud_url;
  const isPlaylist = !!(artist.soundcloud_playlist_url || (artist.soundcloud_url?.includes("/sets/")));
  const galleryMedia = [
    ...media.filter((m) => m.media_type === "photo").slice(0, 9),
    ...media.filter((m) => m.media_type === "video").slice(0, 3),
  ];

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "0.62rem",
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    fontWeight: 700,
    color: "rgba(82,82,91,1)",
    marginBottom: "0.875rem",
  };

  return (
    <div className="min-h-screen bg-[#070708] text-white antialiased">

      {/* ══════════════════════════════════════════
          NAV BAR
          ══════════════════════════════════════════ */}
      <header
        className="sticky top-0 z-30 flex items-center justify-between px-5 sm:px-8 h-14"
        style={{
          background: "rgba(7,7,8,0.88)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-zinc-400 hover:text-white text-sm font-medium transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <Link to="/" className="flex items-center gap-1.5">
          <Music className="h-4 w-4" style={{ color: accent }} />
          <span className="text-xs font-black uppercase tracking-widest text-white">GCI</span>
        </Link>
      </header>

      {/* ══════════════════════════════════════════
          HERO — name-first layout, photo contained
          ══════════════════════════════════════════ */}
      <section
        className="relative"
        style={{
          background: `radial-gradient(ellipse at 75% 50%, ${accent}0c 0%, transparent 55%)`,
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-10 sm:py-16">
          <div className="flex flex-col-reverse lg:flex-row items-start gap-8 lg:gap-16">

            {/* ── LEFT: identity + stats ── */}
            <div className="flex-1 min-w-0">

              {/* Chips row */}
              <div className="flex flex-wrap items-center gap-2 mb-5">
                {artist.onboarding_complete && (
                  <div
                    className="flex items-center gap-1.5 rounded-full"
                    style={{
                      padding: "5px 12px",
                      background: `${accent}12`,
                      border: `1px solid ${accent}38`,
                    }}
                  >
                    <ShieldCheck className="h-3 w-3" style={{ color: accent }} />
                    <span className="font-bold uppercase tracking-wider" style={{ fontSize: "0.6rem", color: accent }}>
                      Verified Artist
                    </span>
                  </div>
                )}
                {(artist.genres || []).slice(0, 3).map((g) => (
                  <span
                    key={g}
                    className="rounded-full font-semibold"
                    style={{
                      padding: "5px 12px",
                      fontSize: "0.65rem",
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "rgba(212,212,216,0.8)",
                    }}
                  >
                    {g}
                  </span>
                ))}
              </div>

              {/* Artist name — the hero element */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                className="font-bold text-white"
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: "clamp(2.8rem, 6vw, 5rem)",
                  lineHeight: 0.92,
                  letterSpacing: "-0.045em",
                  marginBottom: "1rem",
                }}
              >
                {name}
              </motion.h1>

              {/* Location */}
              {artist.location && (
                <div className="flex items-center gap-1.5 mb-8">
                  <MapPin className="h-4 w-4 shrink-0" style={{ color: accent }} />
                  <span className="text-zinc-400 text-sm">{artist.location}</span>
                </div>
              )}

              {/* Match score — inline, confident number */}
              {matchPct != null && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="flex items-center gap-4 mb-8 pb-8"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <div
                    className="font-bold"
                    style={{
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontSize: "3.5rem",
                      color: accent,
                      lineHeight: 1,
                      letterSpacing: "-0.05em",
                    }}
                  >
                    {matchPct}%
                  </div>
                  <div>
                    <p className="font-bold text-white text-sm">Curated match</p>
                    <p className="text-zinc-500 text-xs mt-0.5">
                      Your Spotify taste × artist's SoundCloud portfolio
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Stats row */}
              <div className="flex flex-wrap gap-6">
                {artist.base_rate != null && (
                  <div className="flex items-center gap-2.5">
                    <IndianRupee className="h-4 w-4 shrink-0" style={{ color: accent }} />
                    <div>
                      <p className="font-bold text-white leading-none"
                        style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "1rem" }}>
                        ₹{Number(artist.base_rate).toLocaleString("en-IN")}
                      </p>
                      <p className="text-zinc-500 mt-0.5" style={{ fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.12em" }}>base rate</p>
                    </div>
                  </div>
                )}
                {completedGigs > 0 && (
                  <div className="flex items-center gap-2.5">
                    <CheckCircle className="h-4 w-4 shrink-0" style={{ color: accent }} />
                    <div>
                      <p className="font-bold text-white leading-none"
                        style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "1rem" }}>
                        {completedGigs}
                      </p>
                      <p className="text-zinc-500 mt-0.5" style={{ fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.12em" }}>shows done</p>
                    </div>
                  </div>
                )}
                {(artist.set_durations || []).length > 0 && (
                  <div className="flex items-center gap-2.5">
                    <Clock className="h-4 w-4 shrink-0" style={{ color: accent }} />
                    <div>
                      <p className="font-bold text-white leading-none"
                        style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "1rem" }}>
                        {artist.set_durations.map(formatDuration).join(" · ")}
                      </p>
                      <p className="text-zinc-500 mt-0.5" style={{ fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.12em" }}>set lengths</p>
                    </div>
                  </div>
                )}
                {(artist.event_types || []).length > 0 && (
                  <div className="flex items-center gap-2.5">
                    <Mic2 className="h-4 w-4 shrink-0" style={{ color: accent }} />
                    <div>
                      <p className="font-bold text-white leading-none"
                        style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "1rem" }}>
                        {artist.event_types.slice(0, 2).join(" · ")}
                        {artist.event_types.length > 2 && ` +${artist.event_types.length - 2}`}
                      </p>
                      <p className="text-zinc-500 mt-0.5" style={{ fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.12em" }}>event types</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── RIGHT: contained portrait photo ── */}
            <div className="w-full lg:w-auto lg:shrink-0">
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="relative rounded-2xl overflow-hidden mx-auto lg:mx-0"
                style={{
                  width: "min(100%, 320px)",
                  aspectRatio: "3/4",
                  border: `1px solid ${accent}20`,
                  boxShadow: `0 24px 64px -16px ${accent}25`,
                }}
              >
                {photo ? (
                  <img
                    src={photo}
                    alt={name}
                    className="w-full h-full object-cover object-center"
                  />
                ) : (
                  <AvatarFallback name={name} accent={accent} />
                )}
                {/* Very subtle duotone tint — just a hint, not a wash */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    backgroundColor: accent,
                    mixBlendMode: "color",
                    opacity: 0.15,
                  }}
                />
              </motion.div>
            </div>

          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          MUSIC — SoundCloud embed
          ══════════════════════════════════════════ */}
      {embedUrl && (
        <section className="border-b" style={{ borderColor: "rgba(255,255,255,0.05)", background: "#050506" }}>
          <div className="max-w-7xl mx-auto px-5 sm:px-8 py-10">
            <span style={labelStyle}>{isPlaylist ? "Playlist" : "Music"}</span>
            <div
              className="rounded-2xl overflow-hidden"
              style={{ border: "1px solid rgba(39,39,42,0.8)" }}
            >
              <SoundCloudEmbed url={embedUrl} isPlaylist={isPlaylist} />
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════
          MAIN CONTENT — asymmetric 7/5 grid
          ══════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-5 sm:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">

          {/* LEFT — 7 / 12 */}
          <div className="lg:col-span-7 flex flex-col gap-10">

            {artist.bio && (
              <div>
                <span style={labelStyle}>About</span>
                <p className="text-zinc-300 leading-relaxed">{artist.bio}</p>
              </div>
            )}

            {(artist.genres || []).length > 0 && (
              <div>
                <span style={labelStyle}>Genres</span>
                <div className="flex flex-wrap gap-2">
                  {artist.genres.map((g) => (
                    <span key={g} className="rounded-full font-semibold text-sm"
                      style={{ padding: "7px 14px", background: `${accent}14`, border: `1px solid ${accent}38`, color: accent }}>
                      {g}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {(artist.vibe_tags || []).length > 0 && (
              <div>
                <span style={labelStyle}>Vibe</span>
                <div className="flex flex-wrap gap-2">
                  {artist.vibe_tags.map((v) => (
                    <span key={v} className="px-4 py-2 bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm font-medium rounded-full">
                      {v}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {(artist.performance_cities || []).length > 0 && (
              <div>
                <span style={labelStyle}>Performs in</span>
                <div className="flex flex-wrap gap-2">
                  {artist.performance_cities.map((city) => (
                    <div key={city} className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium"
                      style={{ background: "rgba(24,24,27,0.8)", border: "1px solid rgba(39,39,42,1)", color: "rgba(212,212,216,1)" }}>
                      <Navigation className="h-3 w-3 text-zinc-600 shrink-0" />
                      {city}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(artist.soundcloud_url || social.instagram || social.youtube || social.twitter) && (
              <div>
                <span style={labelStyle}>Links</span>
                <div className="flex flex-wrap gap-2">
                  {artist.soundcloud_url && (
                    <a href={artist.soundcloud_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-full transition-colors"
                      style={{ background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.25)", color: "rgb(251,146,60)" }}>
                      <ExternalLink className="h-3.5 w-3.5" /> SoundCloud
                    </a>
                  )}
                  {social.instagram && (
                    <a href={social.instagram} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white text-xs font-semibold rounded-full transition-colors">
                      <Instagram className="h-3.5 w-3.5" /> Instagram
                    </a>
                  )}
                  {social.youtube && (
                    <a href={social.youtube} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white text-xs font-semibold rounded-full transition-colors">
                      <Youtube className="h-3.5 w-3.5" /> YouTube
                    </a>
                  )}
                  {social.twitter && (
                    <a href={social.twitter} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white text-xs font-semibold rounded-full transition-colors">
                      <Twitter className="h-3.5 w-3.5" /> Twitter
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Media gallery */}
            {galleryMedia.length > 0 && (
              <div>
                <span style={labelStyle}>From the stage</span>
                <div className="columns-2 gap-3 space-y-3">
                  {galleryMedia.map((item) =>
                    item.media_type === "photo" ? (
                      <div key={item.id} className="break-inside-avoid rounded-xl overflow-hidden bg-zinc-950"
                        style={{ border: "1px solid rgba(39,39,42,0.6)" }}>
                        <img src={item.url} alt={item.caption || ""} className="w-full object-cover" loading="lazy" />
                        {item.caption && <p className="px-3 py-2 text-xs text-zinc-500">{item.caption}</p>}
                      </div>
                    ) : (
                      <div key={item.id} className="break-inside-avoid rounded-xl overflow-hidden bg-zinc-950 relative group cursor-pointer"
                        style={{ border: "1px solid rgba(39,39,42,0.6)" }}>
                        <video src={item.url} className="w-full" preload="metadata" />
                        <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.4)" }}>
                          <div className="w-10 h-10 rounded-full flex items-center justify-center"
                            style={{ background: "rgba(255,255,255,0.18)", backdropFilter: "blur(6px)" }}>
                            <Play className="h-4 w-4 text-white fill-white ml-0.5" />
                          </div>
                        </div>
                        {item.caption && <p className="px-3 py-2 text-xs text-zinc-500">{item.caption}</p>}
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT — 5 / 12: sticky booking card */}
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-20 flex flex-col gap-6">
              <div
                className="rounded-3xl p-7 flex flex-col gap-6"
                style={{ background: "#0c0c0e", border: "1px solid rgba(39,39,42,0.9)" }}
              >
                <div>
                  <span style={labelStyle}>Book this artist</span>

                  {artist.base_rate != null && (
                    <>
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="font-bold text-white"
                          style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "2.8rem", lineHeight: 1, letterSpacing: "-0.03em" }}>
                          ₹{Number(artist.base_rate).toLocaleString("en-IN")}
                        </span>
                        <span className="text-zinc-500 text-sm">/ show</span>
                      </div>
                      <p className="text-zinc-600 text-xs">Starting rate · final fee negotiated per event</p>
                    </>
                  )}

                  {completedGigs > 0 && (
                    <div className="flex items-center gap-2 mt-4 px-3.5 py-2.5 rounded-xl"
                      style={{ background: `${accent}0d`, border: `1px solid ${accent}28` }}>
                      <CheckCircle className="h-3.5 w-3.5 shrink-0" style={{ color: accent }} />
                      <span className="text-xs font-semibold" style={{ color: `${accent}cc` }}>
                        {completedGigs} shows completed on platform
                      </span>
                    </div>
                  )}
                </div>

                {(artist.set_durations || []).length > 0 && (
                  <div>
                    <p className="text-xs text-zinc-600 font-semibold uppercase tracking-wider mb-2.5">Set options</p>
                    <div className="flex flex-wrap gap-2">
                      {artist.set_durations.map((d) => (
                        <span key={d} className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-full text-xs text-zinc-300 font-medium">
                          {formatDuration(d)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {(artist.event_types || []).length > 0 && (
                  <div>
                    <p className="text-xs text-zinc-600 font-semibold uppercase tracking-wider mb-2.5">Available for</p>
                    <div className="flex flex-wrap gap-2">
                      {artist.event_types.map((et) => (
                        <span key={et} className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-full text-xs text-zinc-300 font-medium">
                          {et}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-4 font-black text-base rounded-2xl cursor-pointer text-black"
                  style={{ background: accent, boxShadow: `0 4px 24px -4px ${accent}50` }}
                >
                  Request Booking
                </motion.button>

                <div className="flex items-start gap-2 text-xs text-zinc-600">
                  <ShieldCheck className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: `${accent}50` }} />
                  <span>Booking protected by an automated, legally binding contract.</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>
    </div>
  );
}
