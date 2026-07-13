import { motion } from "motion/react";
import { MapPin, IndianRupee, Info } from "lucide-react";
import { ArtistWithProfile } from "../../types/dashboard";

interface ArtistCardProps {
  artist: ArtistWithProfile;
  onClick: () => void;
}

function MatchBadge({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color =
    pct >= 85 ? "from-[#CBA6F7] to-purple-400" :
    pct >= 65 ? "from-blue-400 to-[#CBA6F7]" :
    "from-zinc-500 to-zinc-400";

  return (
    <div className="group relative">
      <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r ${color} shadow-[0_0_14px_rgba(203,166,247,0.45)]`}>
        <span className="text-[11px] font-black text-black tracking-wide">{pct}% Match</span>
        <Info className="h-3 w-3 text-black/60" />
      </div>
      {/* Tooltip */}
      <div className="absolute right-0 top-full mt-2 w-56 bg-zinc-900 border border-zinc-700 rounded-2xl p-3 text-xs text-zinc-300 leading-relaxed opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-50 shadow-xl">
        <p className="font-bold text-white mb-1">AI Match Score</p>
        <p>Based on your Spotify listening history cross-referenced with this artist's SoundCloud portfolio. Higher score = stronger vibe alignment for your event.</p>
      </div>
    </div>
  );
}

function AvatarPlaceholder({ name }: { name: string }) {
  const initial = name?.charAt(0)?.toUpperCase() || "A";
  const colors = [
    "from-purple-500 to-[#CBA6F7]",
    "from-blue-500 to-purple-500",
    "from-pink-500 to-purple-500",
    "from-indigo-500 to-blue-400",
    "from-violet-500 to-pink-400",
  ];
  const color = colors[initial.charCodeAt(0) % colors.length];
  return (
    <div className={`w-full h-full bg-gradient-to-br ${color} flex items-center justify-center`}>
      <span className="text-5xl font-black text-white/90">{initial}</span>
    </div>
  );
}

export default function ArtistCard({ artist, onClick }: ArtistCardProps) {
  const name = artist.profiles?.full_name || "Unknown Artist";
  const visibleGenres = (artist.genres || []).slice(0, 3);
  const hasMore = (artist.genres || []).length > 3;

  return (
    <motion.div
      onClick={onClick}
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.2 }}
      className="group relative bg-zinc-950 border border-zinc-800/80 hover:border-[#CBA6F7]/40 rounded-3xl overflow-hidden cursor-pointer shadow-lg hover:shadow-[0_8px_32px_rgba(203,166,247,0.12)] transition-all duration-300 flex flex-col"
    >
      {/* Avatar / Image */}
      <div className="relative w-full aspect-[4/3] overflow-hidden bg-zinc-900">
        {artist.avatar_url ? (
          <img
            src={artist.avatar_url}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <AvatarPlaceholder name={name} />
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />

        {/* Match score badge — top right */}
        {artist.match_score != null && (
          <div className="absolute top-3 right-3">
            <MatchBadge score={artist.match_score} />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col gap-3 p-5 flex-1">
        {/* Name */}
        <h3 className="text-lg font-extrabold text-white tracking-tight leading-tight">
          {name}
        </h3>

        {/* Genre tags */}
        {visibleGenres.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {visibleGenres.map((g) => (
              <span
                key={g}
                className="px-2.5 py-1 bg-[#CBA6F7]/10 border border-[#CBA6F7]/20 text-[#CBA6F7] text-[11px] font-semibold rounded-full"
              >
                {g}
              </span>
            ))}
            {hasMore && (
              <span className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 text-zinc-500 text-[11px] rounded-full">
                +{(artist.genres || []).length - 3}
              </span>
            )}
          </div>
        )}

        {/* Bio snippet */}
        {artist.bio && (
          <p className="text-sm text-zinc-400 leading-relaxed line-clamp-2">
            {artist.bio}
          </p>
        )}

        {/* Footer: location + rate */}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-zinc-900">
          {artist.location ? (
            <div className="flex items-center gap-1.5 text-zinc-500 text-xs font-medium">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span>{artist.location}</span>
            </div>
          ) : (
            <span />
          )}
          {artist.base_rate != null && (
            <div className="flex items-center gap-0.5 text-white text-sm font-bold">
              <IndianRupee className="h-3.5 w-3.5" />
              <span>{Number(artist.base_rate).toLocaleString("en-IN")}</span>
              <span className="text-zinc-600 text-xs font-normal ml-0.5">/ show</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
