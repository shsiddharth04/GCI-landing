import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArtistWithProfile, getDisplayName, getAccentColor } from "../../types/dashboard";

interface Props {
  artist: ArtistWithProfile;
  onClick: () => void;
}

function AvatarFallback({ name, accent }: { name: string; accent: string }) {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center"
      style={{ background: `linear-gradient(135deg, #111113 0%, ${accent}18 100%)` }}
    >
      <span
        className="font-bold select-none"
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: "6rem",
          color: `${accent}30`,
          lineHeight: 1,
        }}
      >
        {name?.charAt(0)?.toUpperCase() || "A"}
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
      className="relative cursor-pointer select-none rounded-2xl overflow-hidden bg-zinc-950"
      style={{
        aspectRatio: "3/4",
        boxShadow: hovered
          ? `0 16px 48px -8px ${accent}28, 0 0 0 1px ${accent}22`
          : "0 0 0 1px rgba(255,255,255,0.07)",
        transition: "box-shadow 0.35s ease",
      }}
    >
      {/* ── PHOTO SECTION — top 62% ── */}
      <div
        className="absolute inset-x-0 top-0 overflow-hidden"
        style={{ bottom: "38%", isolation: "isolate" }}
      >
        {photo ? (
          <motion.img
            src={photo}
            alt={name}
            className="absolute inset-0 w-full h-full object-cover object-center"
            animate={{ scale: hovered ? 1.04 : 1 }}
            transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          />
        ) : (
          <AvatarFallback name={name} accent={accent} />
        )}

        {/* Subtle duotone — low opacity, just a tint not a wash */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundColor: accent,
            mixBlendMode: "color",
            opacity: hovered ? 0.35 : 0.22,
            transition: "opacity 0.4s ease",
          }}
        />

        {/* Bottom fade into info section */}
        <div
          className="absolute bottom-0 inset-x-0 pointer-events-none"
          style={{
            height: "55px",
            background: "linear-gradient(to bottom, transparent, #09090b)",
          }}
        />

        {/* Top row: genre chip + match score */}
        <div className="absolute top-3 inset-x-3 flex items-start justify-between gap-2 z-10">
          {primaryGenre && (
            <span
              className="rounded-full font-bold uppercase tracking-widest leading-none"
              style={{
                padding: "5px 10px",
                fontSize: "0.58rem",
                backgroundColor: "rgba(0,0,0,0.55)",
                backdropFilter: "blur(8px)",
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
                  fontSize: "1.6rem",
                  color: "white",
                  lineHeight: 1,
                  textShadow: "0 2px 12px rgba(0,0,0,0.8)",
                }}
              >
                {matchPct}
                <span style={{ fontSize: "0.9rem", color: accent }}>%</span>
              </div>
              <div
                className="font-semibold uppercase"
                style={{
                  fontSize: "0.48rem",
                  letterSpacing: "0.18em",
                  color: "rgba(255,255,255,0.4)",
                  marginTop: "3px",
                }}
              >
                match
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── INFO SECTION — bottom 38%, solid background ── */}
      <div
        className="absolute inset-x-0 bottom-0 flex flex-col justify-between px-4 pt-3 pb-4"
        style={{ height: "38%", background: "#09090b" }}
      >
        {/* Artist name */}
        <h3
          className="text-white font-bold truncate"
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: "1.45rem",
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
          }}
        >
          {name}
        </h3>

        {/* Vibe tags — only on hover */}
        <AnimatePresence>
          {hovered && vibes.length > 0 ? (
            <motion.div
              key="vibes"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 2 }}
              transition={{ duration: 0.18 }}
              className="flex flex-wrap gap-1"
            >
              {vibes.map((v) => (
                <span
                  key={v}
                  className="rounded-full text-zinc-400"
                  style={{
                    padding: "3px 8px",
                    fontSize: "0.6rem",
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  {v}
                </span>
              ))}
            </motion.div>
          ) : (
            /* Genre chips shown when not hovering */
            <motion.div
              key="genres"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-wrap gap-1"
            >
              {(artist.genres || []).slice(0, 2).map((g) => (
                <span
                  key={g}
                  className="rounded-full font-semibold"
                  style={{
                    padding: "3px 8px",
                    fontSize: "0.6rem",
                    background: `${accent}14`,
                    border: `1px solid ${accent}35`,
                    color: accent,
                  }}
                >
                  {g}
                </span>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom: location + rate */}
        <div className="flex items-center justify-between">
          {artist.location && (
            <span
              className="text-zinc-500 truncate"
              style={{ fontSize: "0.7rem" }}
            >
              {artist.location}
            </span>
          )}
          {artist.base_rate != null && (
            <span
              className="text-zinc-400 ml-auto font-semibold"
              style={{ fontSize: "0.7rem", fontFamily: "'Space Grotesk', sans-serif" }}
            >
              ₹{Number(artist.base_rate).toLocaleString("en-IN")}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
