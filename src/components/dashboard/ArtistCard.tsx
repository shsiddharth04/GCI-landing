import { motion } from "motion/react";
import { MapPin, IndianRupee, ShieldCheck } from "lucide-react";
import { ArtistWithProfile } from "../../types/dashboard";

interface ArtistCardProps {
  artist: ArtistWithProfile;
  onClick: () => void;
}

function MatchBadge({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const glow =
    pct >= 85 ? "shadow-[0_0_18px_rgba(203,166,247,0.7)]" :
    pct >= 65 ? "shadow-[0_0_18px_rgba(137,180,250,0.5)]" :
    "shadow-none";
  const gradient =
    pct >= 85 ? "from-[#CBA6F7] to-purple-300" :
    pct >= 65 ? "from-[#89b4fa] to-[#CBA6F7]" :
    "from-zinc-500 to-zinc-400";

  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r ${gradient} ${glow}`}>
      <span className="text-[12px] font-black text-black tracking-wide leading-none">{pct}%</span>
      <span className="text-[10px] font-bold text-black/70 leading-none uppercase tracking-widest">Match</span>
    </div>
  );
}

function AvatarPlaceholder({ name }: { name: string }) {
  const initial = name?.charAt(0)?.toUpperCase() || "A";
  const colors = [
    "from-purple-600 to-[#CBA6F7]",
    "from-blue-600 to-purple-500",
    "from-pink-600 to-purple-500",
    "from-indigo-600 to-blue-400",
    "from-violet-600 to-pink-400",
  ];
  const color = colors[initial.charCodeAt(0) % colors.length];
  return (
    <div className={`w-full h-full bg-gradient-to-br ${color} flex items-center justify-center`}>
      <span className="text-6xl font-black text-white/90 select-none">{initial}</span>
    </div>
  );
}

export default function ArtistCard({ artist, onClick }: ArtistCardProps) {
  const name = artist.profiles?.full_name || "Unknown Artist";
  const photo = artist.avatar_url || artist.profiles?.avatar_url;
  const visibleGenres = (artist.genres || []).slice(0, 2);

  return (
    <motion.div
      onClick={onClick}
      whileHover={{ y: -6, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="group relative cursor-pointer rounded-3xl overflow-hidden aspect-[3/4] bg-zinc-950"
      style={{ boxShadow: "0 0 0 1px rgba(255,255,255,0.06)" }}
    >
      {/* Full-bleed photo */}
      <div className="absolute inset-0">
        {photo ? (
          <img
            src={photo}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
        ) : (
          <AvatarPlaceholder name={name} />
        )}
      </div>

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent" />

      {/* Hover border glow */}
      <div className="absolute inset-0 rounded-3xl ring-1 ring-[#CBA6F7]/0 group-hover:ring-[#CBA6F7]/50 transition-all duration-400 pointer-events-none" />

      {/* Top row: match badge + verified */}
      <div className="absolute top-4 left-4 right-4 flex items-start justify-between">
        {artist.onboarding_complete && (
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/10">
            <ShieldCheck className="h-3 w-3 text-[#CBA6F7]" />
            <span className="text-[10px] font-bold text-white/80 uppercase tracking-widest">Verified</span>
          </div>
        )}
        {artist.match_score != null && (
          <div className="ml-auto">
            <MatchBadge score={artist.match_score} />
          </div>
        )}
      </div>

      {/* Genre chips — slide up on hover */}
      <div className="absolute bottom-28 left-4 right-4 flex flex-wrap gap-1.5 translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
        {visibleGenres.map((g) => (
          <span
            key={g}
            className="px-2.5 py-1 bg-black/60 backdrop-blur-md border border-[#CBA6F7]/30 text-[#CBA6F7] text-[10px] font-semibold rounded-full"
          >
            {g}
          </span>
        ))}
      </div>

      {/* Bottom glass info bar */}
      <div className="absolute bottom-0 left-0 right-0 p-4 backdrop-blur-md bg-black/50 border-t border-white/10">
        <div className="flex items-end justify-between gap-2">
          <div className="min-w-0">
            <p className="text-white font-extrabold text-base leading-tight tracking-tight truncate">{name}</p>
            {artist.location && (
              <div className="flex items-center gap-1 text-zinc-400 text-xs mt-0.5">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">{artist.location}</span>
              </div>
            )}
          </div>
          {artist.base_rate != null && (
            <div className="shrink-0 text-right">
              <div className="flex items-center gap-0.5 text-white font-black text-sm justify-end">
                <IndianRupee className="h-3 w-3" />
                <span>{Number(artist.base_rate).toLocaleString("en-IN")}</span>
              </div>
              <p className="text-zinc-500 text-[10px]">/ show</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
