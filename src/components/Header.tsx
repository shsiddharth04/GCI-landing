import { motion } from "motion/react";
import { Sparkles, Music } from "lucide-react";

export default function Header() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-7xl mx-auto px-6 py-6 flex flex-col sm:flex-row justify-between items-center border-b border-zinc-900 gap-4"
    >
      <div className="flex items-center gap-3">
        <div className="bg-[#CBA6F7]/10 p-2 rounded-xl border border-[#CBA6F7]/20 flex items-center justify-center">
          <Music className="h-6 w-6 text-[#CBA6F7]" />
        </div>
        <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
          <span className="font-sans font-black text-xl text-white tracking-tight uppercase">
            GIG CULTURE <span className="text-[#CBA6F7]">INDIA</span>
          </span>
          <span className="text-xs text-zinc-500 font-medium tracking-wide">
            • Revolutionizing Music
          </span>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <nav className="hidden md:flex items-center gap-6 text-sm text-zinc-400 font-medium">
          <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
          <a href="#roster" className="hover:text-white transition-colors">Discover Roster</a>
          <a href="#visualizer" className="hover:text-white transition-colors">AI Matcher</a>
        </nav>
        
        <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900/50 border border-zinc-800 rounded-full">
          <Sparkles className="h-3 w-3 text-[#CBA6F7] animate-pulse" />
          <span className="text-[11px] text-zinc-300 font-semibold tracking-wider uppercase">AI MATCHMAKER ACTIVE</span>
        </div>
      </div>
    </motion.header>
  );
}
