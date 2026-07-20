import React, { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft, MapPin, ShieldCheck, Music,
  Instagram, Youtube, Twitter, ExternalLink, Navigation,
  Play, CheckCircle, Volume2, VolumeX,
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

function SectionLabel({ children, accent }: { children: React.ReactNode; accent: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div style={{ width: 2, height: 14, background: accent, borderRadius: 1, flexShrink: 0 }} />
      <span style={{
        fontSize: "0.58rem",
        letterSpacing: "0.22em",
        textTransform: "uppercase" as const,
        fontWeight: 700,
        color: "rgba(82,82,91,1)",
      }}>
        {children}
      </span>
    </div>
  );
}

function VideoPlayer({ item, accent }: { item: ArtistMedia; accent: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(false);

  // Autoplay muted on mount
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.muted = true;
    el.play().then(() => setPlaying(true)).catch(() => {});
  }, []);

  const togglePlay = () => {
    if (!ref.current) return;
    if (ref.current.paused) {
      ref.current.play().catch(() => {});
      setPlaying(true);
    } else {
      ref.current.pause();
      setPlaying(false);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!ref.current) return;
    const next = !muted;
    ref.current.muted = next;
    setMuted(next);
  };

  return (
    // height is fixed; width is auto so portrait/landscape both render correctly
    <div
      className="relative rounded-2xl overflow-hidden cursor-pointer bg-black flex-shrink-0"
      style={{ height: 420, border: "1px solid rgba(39,39,42,0.8)" }}
      onClick={togglePlay}
    >
      <video
        ref={ref}
        src={item.url}
        style={{ height: "100%", width: "auto", display: "block" }}
        preload="metadata"
        onEnded={() => setPlaying(false)}
        playsInline
        muted
        loop
      />

      {/* Pause overlay — only while paused */}
      <AnimatePresence>
        {!playing && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.45)" }}
          >
            <motion.div
              whileHover={{ scale: 1.08 }}
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{
                background: `${accent}22`,
                backdropFilter: "blur(10px)",
                border: `1.5px solid ${accent}55`,
              }}
            >
              <Play className="h-6 w-6 fill-white text-white ml-1" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mute / unmute — always visible */}
      <button
        onClick={toggleMute}
        className="absolute bottom-3 right-3 flex items-center justify-center rounded-full transition-opacity hover:opacity-100 cursor-pointer"
        style={{
          width: 36,
          height: 36,
          background: "rgba(0,0,0,0.65)",
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(255,255,255,0.12)",
          opacity: 0.8,
        }}
        aria-label={muted ? "Unmute" : "Mute"}
      >
        {muted
          ? <VolumeX className="h-4 w-4 text-white" />
          : <Volume2 className="h-4 w-4 text-white" />}
      </button>

      {item.caption && (
        <p className="absolute bottom-0 left-0 right-0 px-4 py-2 text-xs text-zinc-400"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)" }}>
          {item.caption}
        </p>
      )}
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
  const photos = media.filter((m) => m.media_type === "photo").slice(0, 9);
  const videos = media.filter((m) => m.media_type === "video").slice(0, 4);

  return (
    <div className="min-h-screen bg-[#070708] text-white antialiased">

      {/* ── NAV ──────────────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-30 flex items-center justify-between px-5 sm:px-8 h-14"
        style={{
          background: "rgba(7,7,8,0.85)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
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

      {/* ── HERO — full-bleed editorial ───────────────────────────────── */}
      <section className="relative overflow-hidden" style={{ minHeight: "88vh" }}>

        {/* Full-bleed photo */}
        {photo ? (
          <>
            <img
              src={photo}
              alt={name}
              className="absolute inset-0 w-full h-full object-cover object-center"
            />
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ backgroundColor: accent, mixBlendMode: "color", opacity: 0.10 }}
            />
          </>
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-end pr-8 overflow-hidden"
            style={{ background: `linear-gradient(135deg, #0a0a0c 0%, ${accent}12 100%)` }}
          >
            <span
              className="select-none font-bold"
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: "40vw",
                color: `${accent}08`,
                lineHeight: 1,
                userSelect: "none",
              }}
            >
              {name?.charAt(0)?.toUpperCase() || "A"}
            </span>
          </div>
        )}

        {/* Left dark zone — text readability */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(90deg, #070708 0%, #070708 28%, rgba(7,7,8,0.82) 48%, rgba(7,7,8,0.25) 68%, transparent 88%)",
          }}
        />
        {/* Top fade */}
        <div
          className="absolute inset-x-0 top-0 pointer-events-none"
          style={{ height: "14%", background: "linear-gradient(to bottom, #070708, transparent)" }}
        />
        {/* Bottom fade */}
        <div
          className="absolute inset-x-0 bottom-0 pointer-events-none"
          style={{ height: "42%", background: "linear-gradient(to bottom, transparent, #070708 88%)" }}
        />

        {/* Content: anchored to bottom */}
        <div
          className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 flex flex-col justify-end w-full"
          style={{ minHeight: "88vh", paddingBottom: "3.5rem" }}
        >
          {/* Verified + location */}
          <div className="flex flex-wrap items-center gap-2.5 mb-5">
            {artist.onboarding_complete && (
              <div
                className="inline-flex items-center gap-1.5 rounded-full"
                style={{ padding: "4px 10px", background: `${accent}14`, border: `1px solid ${accent}40` }}
              >
                <ShieldCheck className="h-3 w-3" style={{ color: accent }} />
                <span className="font-bold uppercase tracking-widest" style={{ fontSize: "0.55rem", color: accent }}>
                  Verified Artist
                </span>
              </div>
            )}
            {artist.location && (
              <span className="flex items-center gap-1.5 text-zinc-400" style={{ fontSize: "0.8rem" }}>
                <MapPin className="h-3.5 w-3.5 shrink-0 text-zinc-600" />
                {artist.location}
              </span>
            )}
          </div>

          {/* MASSIVE NAME */}
          <motion.h1
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="text-white font-bold"
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: "clamp(4rem, 9vw, 9rem)",
              lineHeight: 0.87,
              letterSpacing: "-0.055em",
              maxWidth: "65vw",
              textShadow: "0 4px 60px rgba(0,0,0,0.55)",
            }}
          >
            {name}
          </motion.h1>

          {/* Accent bar */}
          <div
            style={{
              height: 2,
              width: "min(200px, 25%)",
              background: `linear-gradient(90deg, ${accent}, transparent)`,
              borderRadius: 2,
              marginTop: "1.5rem",
            }}
          />

          {/* Genre chips */}
          <div className="flex flex-wrap items-center gap-2 mt-4">
            {(artist.genres || []).slice(0, 4).map((g) => (
              <span
                key={g}
                className="rounded-full font-semibold"
                style={{
                  padding: "5px 12px",
                  fontSize: "0.6rem",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  background: "rgba(0,0,0,0.5)",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(255,255,255,0.14)",
                  color: "rgba(212,212,216,1)",
                }}
              >
                {g}
              </span>
            ))}
          </div>

          {/* Stats strip */}
          <div
            className="flex flex-wrap items-center gap-8 mt-8 pt-6"
            style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
          >
            {matchPct != null && (
              <div className="flex items-baseline gap-2">
                <span
                  className="font-bold"
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: "2.4rem",
                    color: accent,
                    lineHeight: 1,
                    letterSpacing: "-0.04em",
                  }}
                >
                  {matchPct}%
                </span>
                <span className="font-semibold uppercase" style={{ fontSize: "0.55rem", letterSpacing: "0.18em", color: "rgba(82,82,91,1)" }}>
                  match
                </span>
              </div>
            )}

            {artist.base_rate != null && (
              <div>
                <p style={{ fontSize: "0.55rem", letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 700, color: "rgba(82,82,91,1)", marginBottom: "0.25rem" }}>
                  Base rate
                </p>
                <p className="font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "1rem" }}>
                  ₹{Number(artist.base_rate).toLocaleString("en-IN")}
                </p>
              </div>
            )}

            {completedGigs > 0 && (
              <div>
                <p style={{ fontSize: "0.55rem", letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 700, color: "rgba(82,82,91,1)", marginBottom: "0.25rem" }}>
                  Shows done
                </p>
                <p className="font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "1rem" }}>
                  {completedGigs}
                </p>
              </div>
            )}

            {(artist.set_durations || []).length > 0 && (
              <div>
                <p style={{ fontSize: "0.55rem", letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 700, color: "rgba(82,82,91,1)", marginBottom: "0.25rem" }}>
                  Set length
                </p>
                <p className="font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "1rem" }}>
                  {artist.set_durations.map(formatDuration).join(" · ")}
                </p>
              </div>
            )}

            {(artist.event_types || []).length > 0 && (
              <div>
                <p style={{ fontSize: "0.55rem", letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 700, color: "rgba(82,82,91,1)", marginBottom: "0.25rem" }}>
                  Event types
                </p>
                <p className="font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "1rem" }}>
                  {artist.event_types.slice(0, 2).join(" · ")}
                  {artist.event_types.length > 2 && ` +${artist.event_types.length - 2}`}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── SOUNDCLOUD ─────────────────────────────────────────────────── */}
      {embedUrl && (
        <section className="border-b" style={{ borderColor: "rgba(255,255,255,0.05)", background: "#050506" }}>
          <div className="max-w-7xl mx-auto px-5 sm:px-8 py-10">
            <SectionLabel accent={accent}>{isPlaylist ? "Playlist" : "Music"}</SectionLabel>
            <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(39,39,42,0.8)" }}>
              <SoundCloudEmbed url={embedUrl} isPlaylist={isPlaylist} />
            </div>
          </div>
        </section>
      )}

      {/* ── SHOWREEL — videos ──────────────────────────────────────────── */}
      {videos.length > 0 && (
        <section className="border-b" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
          <div className="max-w-7xl mx-auto px-5 sm:px-8 py-12">
            <SectionLabel accent={accent}>Showreel</SectionLabel>
            {/* Horizontal scroll — each video keeps its natural aspect ratio at fixed 420px height */}
            <div
              className="flex gap-4 overflow-x-auto pb-2"
              style={{ scrollSnapType: "x mandatory" }}
            >
              {videos.map((v) => (
                <div key={v.id} style={{ scrollSnapAlign: "start" }}>
                  <VideoPlayer item={v} accent={accent} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── MAIN CONTENT — 7 / 5 grid ─────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-5 sm:px-8 py-14 sm:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">

          {/* LEFT — 7 / 12 */}
          <div className="lg:col-span-7 flex flex-col gap-12">

            {artist.bio && (
              <div>
                <SectionLabel accent={accent}>About</SectionLabel>
                <p className="text-zinc-300 leading-relaxed" style={{ fontSize: "0.95rem" }}>{artist.bio}</p>
              </div>
            )}

            {(artist.genres || []).length > 0 && (
              <div>
                <SectionLabel accent={accent}>Genres</SectionLabel>
                <div className="flex flex-wrap gap-2">
                  {artist.genres.map((g) => (
                    <span
                      key={g}
                      className="rounded-full font-semibold"
                      style={{
                        padding: "7px 14px",
                        fontSize: "0.75rem",
                        background: `${accent}12`,
                        border: `1px solid ${accent}35`,
                        color: accent,
                      }}
                    >
                      {g}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {(artist.vibe_tags || []).length > 0 && (
              <div>
                <SectionLabel accent={accent}>Vibe</SectionLabel>
                <div className="flex flex-wrap gap-2">
                  {artist.vibe_tags.map((v) => (
                    <span
                      key={v}
                      className="px-4 py-2 rounded-full text-zinc-300 font-medium"
                      style={{
                        fontSize: "0.75rem",
                        background: "rgba(24,24,27,0.8)",
                        border: "1px solid rgba(39,39,42,1)",
                      }}
                    >
                      {v}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {(artist.performance_cities || []).length > 0 && (
              <div>
                <SectionLabel accent={accent}>Performs in</SectionLabel>
                <div className="flex flex-wrap gap-2">
                  {artist.performance_cities.map((city) => (
                    <div
                      key={city}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-full font-medium"
                      style={{
                        fontSize: "0.75rem",
                        background: "rgba(24,24,27,0.8)",
                        border: "1px solid rgba(39,39,42,1)",
                        color: "rgba(212,212,216,1)",
                      }}
                    >
                      <Navigation className="h-3 w-3 text-zinc-600 shrink-0" />
                      {city}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(artist.soundcloud_url || social.instagram || social.youtube || social.twitter) && (
              <div>
                <SectionLabel accent={accent}>Links</SectionLabel>
                <div className="flex flex-wrap gap-2">
                  {artist.soundcloud_url && (
                    <a
                      href={artist.soundcloud_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-full transition-colors"
                      style={{ background: "rgba(249,115,22,0.10)", border: "1px solid rgba(249,115,22,0.25)", color: "rgb(251,146,60)" }}
                    >
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
                      <Twitter className="h-3.5 w-3.5" /> X / Twitter
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Photo gallery */}
            {photos.length > 0 && (
              <div>
                <SectionLabel accent={accent}>From the stage</SectionLabel>
                <div className="columns-2 gap-3 space-y-3">
                  {photos.map((item) => (
                    <div
                      key={item.id}
                      className="break-inside-avoid rounded-xl overflow-hidden bg-zinc-950"
                      style={{ border: "1px solid rgba(39,39,42,0.6)" }}
                    >
                      <img
                        src={item.url}
                        alt={item.caption || ""}
                        className="w-full object-cover"
                        loading="lazy"
                      />
                      {item.caption && (
                        <p className="px-3 py-2 text-xs text-zinc-500">{item.caption}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* RIGHT — 5/12: booking card */}
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-20 flex flex-col gap-6">
              <div
                className="rounded-3xl p-7 flex flex-col gap-6"
                style={{ background: "#0c0c0e", border: "1px solid rgba(39,39,42,0.9)" }}
              >
                <div>
                  <p style={{
                    fontSize: "0.58rem",
                    letterSpacing: "0.22em",
                    textTransform: "uppercase",
                    fontWeight: 700,
                    color: "rgba(82,82,91,1)",
                    marginBottom: "1rem",
                  }}>
                    Book this artist
                  </p>

                  {artist.base_rate != null && (
                    <>
                      <div className="flex items-baseline gap-2 mb-1">
                        <span
                          className="font-bold text-white"
                          style={{
                            fontFamily: "'Space Grotesk', sans-serif",
                            fontSize: "2.8rem",
                            lineHeight: 1,
                            letterSpacing: "-0.03em",
                          }}
                        >
                          ₹{Number(artist.base_rate).toLocaleString("en-IN")}
                        </span>
                        <span className="text-zinc-500 text-sm">/ show</span>
                      </div>
                      <p className="text-zinc-600 text-xs">Starting rate · final fee negotiated per event</p>
                    </>
                  )}

                  {completedGigs > 0 && (
                    <div
                      className="flex items-center gap-2 mt-4 px-3.5 py-2.5 rounded-xl"
                      style={{ background: `${accent}0d`, border: `1px solid ${accent}28` }}
                    >
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
