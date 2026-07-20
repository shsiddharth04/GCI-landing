import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArtistWithProfile, getDisplayName, getAccentColor } from "../../types/dashboard";

interface Props {
  artist: ArtistWithProfile;
  onClick: () => void;
}

function AvatarFallback({ name, accent }: { name: string; accent: string }) {
  const initial = name?.charAt(0)?.toUpperCase() || "A";
  return (
    <div
      className="absolute inset-0 flex items-center justify-center overflow-hidden"
      style={{ background: `${accent}12` }}
    >
      <span
        className="font-bold select-none"
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: "13rem",
          color: `${accent}18`,
          lineHeight: 1,
          marginTop: "3rem",
        }}
      >
        {initial}
      </span>
    </div>
  );
}

export default function ArtistCard({ artist, onClick }: Props) {
  const [hovered, setHovered] = useState(false);

  const name = getDisplayName(artist);
  const photo = artist.avatar_url || artist.profiles?.avatar_url;
  const accent = getAccentColor(artist.genres);
  const primaryGenre = (artist.genres || [])[0] ?? null;
  const matchPct = artist.match_score != null ? Math.round(artist.match_score * 100) : null;
  const vibes = (artist.vibe_tags || []).slice(0, 3);

  return (
    <motion.div
      onClick={onClick}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      whileTap={{ scale: 0.98 }}
      className="relative cursor-pointer rounded-2xl overflow-hidden aspect-[3/4] bg-zinc-950 select-none"
      style={{
        boxShadow: hovered
          ? `0 20px 60px -8px ${accent}40, 0 0 0 1px ${accent}30`
          : "0 0 0 1px rgba(255,255,255,0.07)",
        transition: "box-shadow 0.4s ease",
      }}
    >
      {/* ── Duotone photo — contained in isolation context ── */}
      <div className="absolute inset-0" style={{ isolation: "isolate" }}>
        {photo ? (
          <motion.img
            src={photo}
            alt={name}
            className="absolute inset-0 w-full h-full object-cover object-top"
            style={{ filter: "grayscale(1) brightness(1.07) contrast(1.08)" }}
            animate={{ scale: hovered ? 1.05 : 1 }}
            transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
          />
        ) : (
          <AvatarFallback name={name} accent={accent} />
        )}
        {/* Color wash — mix-blend-mode: color over grayscale = duotone */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundColor: accent,
            mixBlendMode: "color",
            opacity: hovered ? 0.65 : 0.52,
            transition: "opacity 0.5s ease",
          }}
        />
      </div>

      {/* ── Gradient layers — outside isolation so they render pure ── */}
      {/* Bottom fade: photo into near-black for text legibility */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(to top, rgba(7,7,8,0.97) 0%, rgba(7,7,8,0.52) 36%, rgba(7,7,8,0.08) 62%, transparent 100%)",
        }}
      />
      {/* Top vignette: for chip + score legibility */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(to bottom, rgba(7,7,8,0.52) 0%, transparent 32%)",
        }}
      />

      {/* ── Top row: primary genre chip + match score ── */}
      <div className="absolute top-4 left-4 right-4 z-10 flex items-start justify-between gap-2">
        {primaryGenre && (
          <span
            className="px-2.5 rounded-full font-bold uppercase tracking-widest leading-none"
            style={{
              paddingTop: "5px",
              paddingBottom: "5px",
              fontSize: "0.6rem",
              backgroundColor: `${accent}22`,
              border: `1px solid ${accent}50`,
              color: accent,
            }}
          >
            {primaryGenre}
          </span>
        )}

        {matchPct != null && (
          <div className="ml-auto text-right" style={{ lineHeight: 1 }}>
            <div
              className="font-bold"
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: "1.75rem",
                color: accent,
                lineHeight: 1,
              }}
            >
              {matchPct}
            </div>
            <div
              className="font-semibold uppercase"
              style={{
                fontSize: "0.5rem",
                letterSpacing: "0.15em",
                color: "rgba(255,255,255,0.32)",
                marginTop: "3px",
              }}
            >
              % match
            </div>
          </div>
        )}
      </div>

      {/* ── Vibe tags — animate in on hover above name row ── */}
      <AnimatePresence>
        {hovered && vibes.length > 0 && (
          <motion.div
            key="vibes"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute left-4 right-4 z-10 flex flex-wrap gap-1.5"
            style={{ bottom: "5.75rem" }}
          >
            {vibes.map((v) => (
              <span
                key={v}
                className="rounded-full font-medium"
                style={{
                  padding: "5px 10px",
                  fontSize: "0.62rem",
                  background: "rgba(0,0,0,0.65)",
                  backdropFilter: "blur(8px)",
                  border: "1px solid rgba(255,255,255,0.13)",
                  color: "rgba(255,255,255,0.65)",
                }}
              >
                {v}
              </span>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Bottom info ── */}
      <div className="absolute bottom-0 left-0 right-0 pb-4 z-10">
        {/*
          Artist name: pl-4 only (no right padding) so long names bleed off the
          card's right edge — the card's overflow:hidden clips them naturally.
          whitespace-nowrap prevents line breaks; the "bleed" is the signature
          element: the name is too large for the card; the profile lets it breathe.
        */}
        <h3
          className="whitespace-nowrap font-bold text-white"
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: "3rem",
            lineHeight: 0.88,
            letterSpacing: "-0.04em",
            paddingLeft: "1rem",
            marginBottom: "0.4rem",
          }}
        >
          {name}
        </h3>

        {/* City + rate row — restored right padding */}
        <div
          className="flex items-center gap-3"
          style={{ paddingLeft: "1rem", paddingRight: "1rem" }}
        >
          {artist.location && (
            <span
              style={{
                fontSize: "0.72rem",
                color: "rgba(161,161,170,0.75)",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              {artist.location}
            </span>
          )}
          {artist.base_rate != null && (
            <span
              className="ml-auto"
              style={{
                fontSize: "0.72rem",
                color: "rgba(161,161,170,0.6)",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              ₹{Number(artist.base_rate).toLocaleString("en-IN")}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
