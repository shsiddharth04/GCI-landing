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

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function SoundCloudEmbed({ url, isPlaylist }: { url: string; isPlaylist: boolean }) {
  const src = `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%23CBA6F7&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false${isPlaylist ? "&show_artwork=true" : "&visual=true"}`;
  return (
    <iframe
      width="100%"
      height={isPlaylist ? "400" : "280"}
      scrolling="no"
      frameBorder="no"
      allow="autoplay"
      src={src}
      className="rounded-2xl block"
      title="SoundCloud player"
    />
  );
}

function formatDuration(mins: number): string {
  if (mins < 60) return `${mins}m`;
  if (mins % 60 === 0) return `${mins / 60}h`;
  return `${Math.floor(mins / 60)}h${mins % 60}m`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export default function ArtistProfile() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [artist, setArtist] = useState<ArtistWithProfile | null>(null);
  const [media, setMedia] = useState<ArtistMedia[]>([]);
  const [completedGigs, setCompletedGigs] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Match score comes from the host dashboard as a URL param (e.g. ?match=92)
  const matchRaw = searchParams.get("match");
  const matchPct = matchRaw != null ? Math.round(Number(matchRaw)) : null;

  useEffect(() => {
    if (!id) return;
    Promise.all([
      supabase
        .from("artists")
        .select("*, profiles(full_name, avatar_url)")
        .eq("id", id)
        .single(),
      supabase
        .from("artist_media")
        .select("*")
        .eq("artist_id", id)
        .order("display_order"),
      supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .eq("artist_id", id)
        .eq("status", "completed"),
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
        <div
          className="w-8 h-8 rounded-full border-2 animate-spin"
          style={{ borderColor: "rgba(203,166,247,0.25)", borderTopColor: "#CBA6F7" }}
        />
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="min-h-screen bg-[#070708] flex flex-col items-center justify-center gap-4 text-white">
        <p className="text-zinc-400">Artist not found.</p>
        <button
          onClick={() => navigate(-1)}
          className="text-[#CBA6F7] text-sm hover:underline cursor-pointer"
        >
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
  const isPlaylist = !!(
    artist.soundcloud_playlist_url ||
    (artist.soundcloud_url && artist.soundcloud_url.includes("/sets/"))
  );

  // Split media for the gallery
  const galleryMedia = [
    ...media.filter((m) => m.media_type === "photo").slice(0, 8),
    ...media.filter((m) => m.media_type === "video").slice(0, 3),
  ];

  // ─── Shared section label style ────────────────────────────────────────────
  const sectionLabel = {
    fontSize: "0.65rem",
    letterSpacing: "0.18em",
    textTransform: "uppercase" as const,
    fontWeight: 700,
    color: "rgba(82,82,91,1)",
    marginBottom: "1rem",
    display: "block",
  };

  return (
    <div className="min-h-screen bg-[#070708] text-white antialiased">

      {/* ════════════════════════════════════════════════════════════════════
          HERO — full-viewport duotone photo with editorial name layout
          ════════════════════════════════════════════════════════════════════ */}
      <div
        className="relative w-full overflow-hidden"
        style={{ height: "92vh", minHeight: "520px" }}
      >
        {/* Photo + duotone — isolation context confines mix-blend-mode */}
        <div className="absolute inset-0" style={{ isolation: "isolate" }}>
          {photo ? (
            <img
              src={photo}
              alt={name}
              className="absolute inset-0 w-full h-full object-cover object-top"
              style={{
                transform: "scale(1.04)",
                filter: "grayscale(1) brightness(1.07) contrast(1.06)",
              }}
            />
          ) : (
            <div
              className="absolute inset-0 flex items-center justify-center overflow-hidden"
              style={{ background: `${accent}10` }}
            >
              <span
                className="font-bold select-none"
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: "40vw",
                  color: `${accent}10`,
                  lineHeight: 1,
                }}
              >
                {name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          {/* Duotone color wash */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundColor: accent,
              mixBlendMode: "color",
              opacity: 0.65,
            }}
          />
        </div>

        {/* Gradient layers — outside isolation, render unaffected by blend */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(to top, #070708 0%, rgba(7,7,8,0.68) 32%, rgba(7,7,8,0.12) 65%, transparent 100%)",
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(to bottom, rgba(7,7,8,0.55) 0%, transparent 28%)",
          }}
        />

        {/* Top nav */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 sm:px-8 py-6 z-10">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2.5 text-white text-sm font-medium rounded-full cursor-pointer transition-colors"
            style={{
              background: "rgba(0,0,0,0.42)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <Link
            to="/"
            className="flex items-center gap-2 px-4 py-2.5 rounded-full"
            style={{
              background: "rgba(0,0,0,0.42)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <Music className="h-4 w-4" style={{ color: accent }} />
            <span className="text-xs font-black uppercase tracking-widest text-white">GCI</span>
          </Link>
        </div>

        {/* Hero bottom: name (left) + match score (right, desktop only) */}
        <div className="absolute bottom-0 left-0 right-0 px-5 sm:px-8 pb-10 z-10">
          <div className="max-w-7xl mx-auto flex items-end justify-between gap-6">

            {/* Name block */}
            <div className="flex-1 min-w-0">
              {/* Verified + genre chips */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {artist.onboarding_complete && (
                  <div
                    className="flex items-center gap-1.5 px-3 rounded-full"
                    style={{
                      padding: "7px 12px",
                      background: "rgba(0,0,0,0.5)",
                      backdropFilter: "blur(10px)",
                      border: `1px solid ${accent}48`,
                    }}
                  >
                    <ShieldCheck className="h-3.5 w-3.5" style={{ color: accent }} />
                    <span
                      className="font-bold uppercase tracking-wider"
                      style={{ fontSize: "0.65rem", color: accent }}
                    >
                      Verified Artist
                    </span>
                  </div>
                )}
                {(artist.genres || []).slice(0, 2).map((g) => (
                  <span
                    key={g}
                    className="font-semibold rounded-full"
                    style={{
                      padding: "7px 12px",
                      fontSize: "0.65rem",
                      background: `${accent}1c`,
                      border: `1px solid ${accent}40`,
                      color: accent,
                    }}
                  >
                    {g}
                  </span>
                ))}
              </div>

              {/* Artist name — same oversized grotesque as card, but unconstrained */}
              <motion.h1
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="text-white font-bold"
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: "clamp(3rem, 7.5vw, 6.5rem)",
                  lineHeight: 0.88,
                  letterSpacing: "-0.04em",
                  marginBottom: "0.75rem",
                  textShadow: "0 2px 48px rgba(0,0,0,0.65)",
                }}
              >
                {name}
              </motion.h1>

              {artist.location && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 shrink-0" style={{ color: accent }} />
                  <span className="text-zinc-300 text-sm">{artist.location}</span>
                </div>
              )}
            </div>

            {/* Match score — desktop only. Large editorial number, no gauge. */}
            {matchPct != null && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="hidden sm:flex flex-col items-end shrink-0"
              >
                <div
                  className="font-bold"
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: "clamp(4rem, 6vw, 6rem)",
                    color: accent,
                    lineHeight: 0.85,
                    letterSpacing: "-0.05em",
                  }}
                >
                  {matchPct}
                </div>
                <div
                  className="font-bold uppercase"
                  style={{
                    fontSize: "0.58rem",
                    letterSpacing: "0.2em",
                    color: `${accent}65`,
                    marginTop: "0.5rem",
                  }}
                >
                  % curated match
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          STATS BAR
          ════════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          borderTop: "1px solid rgba(39,39,42,0.8)",
          borderBottom: "1px solid rgba(39,39,42,0.8)",
          background: "rgba(9,9,10,0.9)",
          backdropFilter: "blur(10px)",
        }}
      >
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-5 flex flex-wrap gap-x-8 gap-y-4">

          {artist.base_rate != null && (
            <StatCell icon={<IndianRupee className="h-4 w-4" style={{ color: accent }} />} accent={accent}
              value={`₹${Number(artist.base_rate).toLocaleString("en-IN")}`} label="base rate" />
          )}

          {completedGigs > 0 && (
            <StatCell icon={<CheckCircle className="h-4 w-4" style={{ color: accent }} />} accent={accent}
              value={String(completedGigs)} label="shows done" />
          )}

          {(artist.set_durations || []).length > 0 && (
            <StatCell icon={<Clock className="h-4 w-4" style={{ color: accent }} />} accent={accent}
              value={artist.set_durations.map(formatDuration).join(" · ")} label="set lengths" />
          )}

          {(artist.event_types || []).length > 0 && (
            <StatCell icon={<Mic2 className="h-4 w-4" style={{ color: accent }} />} accent={accent}
              value={
                artist.event_types.slice(0, 3).join(" · ") +
                (artist.event_types.length > 3 ? ` +${artist.event_types.length - 3}` : "")
              }
              label="event types"
            />
          )}

          {/* Match score in stats bar on mobile (hero version is hidden on mobile) */}
          {matchPct != null && (
            <div className="sm:hidden flex items-center gap-2.5">
              <div
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: accent, boxShadow: `0 0 8px ${accent}` }}
              />
              <div>
                <p
                  className="font-bold leading-none"
                  style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "1rem", color: "white" }}
                >
                  {matchPct}%
                </p>
                <p style={{ fontSize: "0.62rem", color: "rgba(113,113,122,1)", marginTop: "3px", textTransform: "uppercase", letterSpacing: "0.12em" }}>
                  ai match
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          MAIN CONTENT — asymmetric 7/5 grid
          Left:  about · genres · vibe · cities · social · media gallery
          Right: SoundCloud embed · sticky booking card
          ════════════════════════════════════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">

          {/* ── LEFT COLUMN — 7 / 12 ── */}
          <div className="lg:col-span-7 flex flex-col gap-12">

            {artist.bio && (
              <section>
                <span style={sectionLabel}>About</span>
                <p className="text-zinc-300 leading-relaxed text-base">{artist.bio}</p>
              </section>
            )}

            {(artist.genres || []).length > 0 && (
              <section>
                <span style={sectionLabel}>Genres</span>
                <div className="flex flex-wrap gap-2">
                  {artist.genres.map((g) => (
                    <span
                      key={g}
                      className="rounded-full font-semibold text-sm"
                      style={{
                        padding: "8px 14px",
                        background: `${accent}14`,
                        border: `1px solid ${accent}38`,
                        color: accent,
                      }}
                    >
                      {g}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {(artist.vibe_tags || []).length > 0 && (
              <section>
                <span style={sectionLabel}>Vibe</span>
                <div className="flex flex-wrap gap-2">
                  {artist.vibe_tags.map((v) => (
                    <span
                      key={v}
                      className="px-4 py-2 bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm font-medium rounded-full"
                    >
                      {v}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {(artist.performance_cities || []).length > 0 && (
              <section>
                <span style={sectionLabel}>Performs in</span>
                <div className="flex flex-wrap gap-2">
                  {artist.performance_cities.map((city) => (
                    <div
                      key={city}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium"
                      style={{
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
              </section>
            )}

            {(artist.soundcloud_url || social.instagram || social.youtube || social.twitter) && (
              <section>
                <span style={sectionLabel}>Links</span>
                <div className="flex flex-wrap gap-2">
                  {artist.soundcloud_url && (
                    <a
                      href={artist.soundcloud_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-full transition-colors"
                      style={{
                        background: "rgba(249,115,22,0.1)",
                        border: "1px solid rgba(249,115,22,0.25)",
                        color: "rgb(251,146,60)",
                      }}
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
                      <Twitter className="h-3.5 w-3.5" /> Twitter
                    </a>
                  )}
                </div>
              </section>
            )}

            {/* Media gallery — masonry, 2-column within the left column */}
            {galleryMedia.length > 0 && (
              <section>
                <span style={sectionLabel}>From the stage</span>
                <div className="columns-2 gap-3 space-y-3">
                  {galleryMedia.map((item) =>
                    item.media_type === "photo" ? (
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
                    ) : (
                      <div
                        key={item.id}
                        className="break-inside-avoid rounded-xl overflow-hidden bg-zinc-950 relative group cursor-pointer"
                        style={{ border: "1px solid rgba(39,39,42,0.6)" }}
                      >
                        <video src={item.url} className="w-full" preload="metadata" />
                        <div className="absolute inset-0 flex items-center justify-center transition-colors"
                          style={{ background: "rgba(0,0,0,0.42)" }}>
                          <div
                            className="w-11 h-11 rounded-full flex items-center justify-center"
                            style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(6px)" }}
                          >
                            <Play className="h-4 w-4 text-white fill-white ml-0.5" />
                          </div>
                        </div>
                        {item.caption && (
                          <p className="px-3 py-2 text-xs text-zinc-500">{item.caption}</p>
                        )}
                      </div>
                    )
                  )}
                </div>
              </section>
            )}
          </div>

          {/* ── RIGHT COLUMN — 5 / 12 ── */}
          <div className="lg:col-span-5 flex flex-col gap-8">

            {/* SoundCloud embed */}
            {embedUrl && (
              <div>
                <span style={sectionLabel}>{isPlaylist ? "Playlist" : "Music"}</span>
                <div
                  className="rounded-2xl overflow-hidden"
                  style={{ border: "1px solid rgba(39,39,42,0.8)" }}
                >
                  <SoundCloudEmbed url={embedUrl} isPlaylist={isPlaylist} />
                </div>
              </div>
            )}

            {/* Booking card — sticky on desktop */}
            <div
              className="rounded-3xl p-7 flex flex-col gap-6 lg:sticky lg:top-8"
              style={{
                background: "#09090a",
                border: "1px solid rgba(39,39,42,0.9)",
              }}
            >
              <div>
                <span style={sectionLabel}>Book this artist</span>

                {artist.base_rate != null && (
                  <>
                    <div className="flex items-baseline gap-2 mb-1">
                      <span
                        className="font-bold text-white"
                        style={{
                          fontFamily: "'Space Grotesk', sans-serif",
                          fontSize: "3rem",
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
                    className="flex items-center gap-2 mt-4 px-3 py-2.5 rounded-xl"
                    style={{
                      background: `${accent}0d`,
                      border: `1px solid ${accent}28`,
                    }}
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
                      <span
                        key={d}
                        className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-full text-xs text-zinc-300 font-medium"
                      >
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
                      <span
                        key={et}
                        className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-full text-xs text-zinc-300 font-medium"
                      >
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
                style={{
                  background: accent,
                  boxShadow: `0 4px 28px -4px ${accent}55`,
                }}
              >
                Request Booking
              </motion.button>

              <div className="flex items-start gap-2 text-xs text-zinc-600">
                <ShieldCheck className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: `${accent}55` }} />
                <span>Booking protected by an automated, legally binding contract.</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Stats bar cell — extracted to avoid repetition in the stats section above
// ─────────────────────────────────────────────────────────────────────────────
function StatCell({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  accent: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="shrink-0">{icon}</div>
      <div>
        <p
          className="font-bold leading-none text-white"
          style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "1rem" }}
        >
          {value}
        </p>
        <p
          style={{
            fontSize: "0.62rem",
            color: "rgba(113,113,122,1)",
            marginTop: "3px",
            textTransform: "uppercase",
            letterSpacing: "0.12em",
          }}
        >
          {label}
        </p>
      </div>
    </div>
  );
}
