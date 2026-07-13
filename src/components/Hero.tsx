import { motion } from "motion/react";
import { ArrowRight, AudioLines } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface HeroProps {
  onConnectClick: () => void;
  onArtistConnectClick: () => void;
  scanStatus: string;
}

export default function Hero({ onConnectClick, onArtistConnectClick, scanStatus }: HeroProps) {
  const navigate = useNavigate();
  return (
    <section className="w-full max-w-5xl mx-auto px-6 py-16 md:py-24 text-center relative overflow-hidden">
      {/* Dynamic ambient lavender glow in background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-[#CBA6F7]/5 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 flex flex-col items-center gap-6"
      >
        {/* Spark/Vibe badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#CBA6F7]/10 border border-[#CBA6F7]/20 rounded-full text-[#CBA6F7]">
          <AudioLines className="h-4 w-4 animate-pulse" />
          <span className="text-xs font-semibold tracking-wide">MATCH SPOTIFY × SOUNDCLOUD</span>
        </div>

        {/* Headline */}
        <h1 className="font-sans font-extrabold text-4xl sm:text-5xl md:text-6xl text-white tracking-tight leading-[1.1] max-w-4xl">
          The AI Matchmaker for <span className="text-[#CBA6F7] relative">Live Music<span className="absolute left-0 bottom-1 w-full h-[6px] bg-[#CBA6F7]/20 -z-10" /></span>.
        </h1>

        {/* Subheadline */}
        <p className="text-base sm:text-lg text-gray-300 max-w-2xl leading-relaxed font-normal">
          Our AI connects event hosts with independent musical artists through algorithmic taste pairing. Book securely, play directly, protect your craft.
        </p>

        {/* CTA Buttons */}
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
          <motion.button
            onClick={() => navigate("/auth?role=host")}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            className="px-8 py-4 bg-[#CBA6F7] text-black font-semibold text-base rounded-full shadow-[0_4px_20px_rgba(203,166,247,0.4)] hover:shadow-[0_4px_30px_rgba(203,166,247,0.6)] hover:bg-[#b58ce6] transition-all duration-300 flex items-center gap-2 cursor-pointer group"
          >
            <span>Get Started as a Host</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </motion.button>

          <motion.button
            onClick={() => navigate("/auth?role=artist")}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            className="px-8 py-4 bg-transparent text-[#CBA6F7] border-2 border-[#CBA6F7] hover:bg-[#CBA6F7]/10 font-semibold text-base rounded-full transition-all duration-300 flex items-center gap-2 cursor-pointer group"
          >
            <span>Join as an Artist</span>
            <ArrowRight className="h-4 w-4 text-[#CBA6F7] transition-transform group-hover:translate-x-1" />
          </motion.button>
        </div>

        {/* Live counter bar */}
        <div className="mt-12 flex justify-center gap-12 text-zinc-500 text-xs">
          <div>
            <span className="text-white font-bold text-sm block">100%</span>
            Independent Artists
          </div>
          <div className="border-r border-zinc-800 h-8 self-center" />
          <div>
            <span className="text-white font-bold text-sm block">Under 5s</span>
            Matchmaking Time
          </div>
          <div className="border-r border-zinc-800 h-8 self-center" />
          <div>
            <span className="text-white font-bold text-sm block">Zero Friction</span>
            Direct Booking
          </div>
        </div>
      </motion.div>
    </section>
  );
}
