import { motion, AnimatePresence } from "motion/react";
import { X, MapPin, IndianRupee, ExternalLink, Instagram, Youtube, Twitter, Info, Navigation } from "lucide-react";
import { ArtistWithProfile } from "../../types/dashboard";

interface ArtistDetailModalProps {
  artist: ArtistWithProfile | null;
  onClose: () => void;
  onRequestBooking: (artist: ArtistWithProfile) => void;
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
      <span className="text-7xl font-black text-white/90">{initial}</span>
    </div>
  );
}

function MatchScoreSection({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const barColor = pct >= 85 ? "#CBA6F7" : pct >= 65 ? "#89b4fa" : "#71717a";

  return (
    <div className="bg-[#CBA6F7]/5 border border-[#CBA6F7]/20 rounded-2xl p-5">
      <div className="flex items-start gap-3">
        <div className="bg-[#CBA6F7]/15 p-2 rounded-xl shrink-0">
          <Info className="h-4 w-4 text-[#CBA6F7]" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-bold text-white">AI Match Score</p>
            <span className="text-xl font-black text-[#CBA6F7]">{pct}%</span>
          </div>
          {/* Progress bar */}
          <div className="w-full h-1.5 bg-zinc-800 rounded-full mb-3 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{ backgroundColor: barColor }}
            />
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            This score reflects how strongly this artist's sonic style aligns with your event vibe — derived by cross-referencing your <span className="text-[#CBA6F7] font-semibold">Spotify listening history</span> against the artist's <span className="text-[#CBA6F7] font-semibold">SoundCloud portfolio</span>. A higher score means the crowd you draw will likely resonate with this artist's sound.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ArtistDetailModal({ artist, onClose, onRequestBooking }: ArtistDetailModalProps) {
  if (!artist) return null;
  const name = artist.profiles?.full_name || "Unknown Artist";
  const social = (artist.social_links || {}) as Record<string, string>;

  return (
    <AnimatePresence>
      {artist && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed inset-x-4 bottom-0 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:top-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-2xl z-50 max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-zinc-950 border border-zinc-800 shadow-2xl"
          >
            {/* Hero image */}
            <div className="relative w-full h-56 sm:h-64 overflow-hidden rounded-t-3xl sm:rounded-t-3xl bg-zinc-900 shrink-0">
              {artist.avatar_url ? (
                <img src={artist.avatar_url} alt={name} className="w-full h-full object-cover" />
              ) : (
                <AvatarPlaceholder name={name} />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/30 to-transparent" />
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/80 rounded-full transition-colors cursor-pointer"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 flex flex-col gap-6">
              {/* Name + location + rate */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-extrabold text-white tracking-tight">{name}</h2>
                  {artist.location && (
                    <div className="flex items-center gap-1.5 text-zinc-500 text-sm mt-1">
                      <MapPin className="h-4 w-4" />
                      <span>{artist.location}</span>
                    </div>
                  )}
                </div>
                {artist.base_rate != null && (
                  <div className="text-right shrink-0">
                    <div className="flex items-center gap-0.5 text-white text-xl font-black justify-end">
                      <IndianRupee className="h-4 w-4" />
                      <span>{Number(artist.base_rate).toLocaleString("en-IN")}</span>
                    </div>
                    <p className="text-xs text-zinc-600">base rate / show</p>
                  </div>
                )}
              </div>

              {/* Match score */}
              {artist.match_score != null && (
                <MatchScoreSection score={artist.match_score} />
              )}

              {/* Genres */}
              {(artist.genres || []).length > 0 && (
                <div>
                  <p className="text-[11px] text-zinc-600 uppercase tracking-widest font-bold mb-2">Genres</p>
                  <div className="flex flex-wrap gap-2">
                    {artist.genres.map((g) => (
                      <span
                        key={g}
                        className="px-3 py-1.5 bg-[#CBA6F7]/10 border border-[#CBA6F7]/20 text-[#CBA6F7] text-xs font-semibold rounded-full"
                      >
                        {g}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Bio */}
              {artist.bio && (
                <div>
                  <p className="text-[11px] text-zinc-600 uppercase tracking-widest font-bold mb-2">About</p>
                  <p className="text-sm text-zinc-300 leading-relaxed">{artist.bio}</p>
                </div>
              )}

              {/* Performance cities */}
              {(artist.performance_cities || []).length > 0 && (
                <div>
                  <p className="text-[11px] text-zinc-600 uppercase tracking-widest font-bold mb-2">Available to perform in</p>
                  <div className="flex flex-wrap gap-2">
                    {artist.performance_cities.map((city) => (
                      <div
                        key={city}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-full text-xs text-zinc-300 font-medium"
                      >
                        <Navigation className="h-3 w-3 text-zinc-500" />
                        {city}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Links */}
              <div className="flex flex-wrap gap-3">
                {artist.soundcloud_url && (
                  <a
                    href={artist.soundcloud_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold rounded-full hover:bg-orange-500/20 transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    SoundCloud
                  </a>
                )}
                {social.instagram && (
                  <a href={social.instagram} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs font-semibold rounded-full hover:text-white transition-colors">
                    <Instagram className="h-3.5 w-3.5" />
                    Instagram
                  </a>
                )}
                {social.youtube && (
                  <a href={social.youtube} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs font-semibold rounded-full hover:text-white transition-colors">
                    <Youtube className="h-3.5 w-3.5" />
                    YouTube
                  </a>
                )}
                {social.twitter && (
                  <a href={social.twitter} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs font-semibold rounded-full hover:text-white transition-colors">
                    <Twitter className="h-3.5 w-3.5" />
                    Twitter
                  </a>
                )}
              </div>

              {/* CTA */}
              <motion.button
                onClick={() => onRequestBooking(artist)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-4 bg-[#CBA6F7] hover:bg-[#b58ce6] text-black font-black text-base rounded-2xl shadow-[0_4px_20px_rgba(203,166,247,0.35)] transition-all duration-300 cursor-pointer"
              >
                Request Booking
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
