import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Play, Pause, SkipForward, SkipBack, Music, HelpCircle, AudioLines, Sparkles, Volume2 } from "lucide-react";
import { ScanState } from "../types";

interface InteractiveVisualizerProps {
  scanState: ScanState;
  isPlaying: boolean;
  onPlayToggle: () => void;
  onNextTrack: () => void;
  onPrevTrack: () => void;
  currentTime: number;
  duration: number;
}

export default function InteractiveVisualizer({
  scanState,
  isPlaying,
  onPlayToggle,
  onNextTrack,
  onPrevTrack,
  currentTime,
  duration,
}: InteractiveVisualizerProps) {
  const [pulseScale, setPulseScale] = useState(1);

  // Playback beat trigger
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setPulseScale((prev) => (prev === 1 ? 1.05 : 1));
      }, 500);
    } else {
      setPulseScale(1);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying]);

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const percent = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Render reactive equalizers/soundwaves for playing tracks
  const renderSoundwave = () => {
    if (!isPlaying) {
      return (
        <div className="flex justify-center items-center gap-1.5 h-16 opacity-30">
          {Array.from({ length: 16 }).map((_, i) => (
            <div key={i} className="w-1.5 bg-zinc-700 h-2 rounded-full" />
          ))}
        </div>
      );
    }

    return (
      <div className="flex justify-center items-center gap-1.5 h-16">
        {Array.from({ length: 16 }).map((_, i) => {
          // Generate customized height anims
          const randomDuration = 0.5 + Math.random() * 0.8;
          const randomDelay = Math.random() * 0.4;
          return (
            <motion.div
              key={i}
              animate={{
                height: [8, 48, 16, 56, 8],
              }}
              transition={{
                duration: randomDuration,
                repeat: Infinity,
                delay: randomDelay,
                ease: "easeInOut",
              }}
              className="w-1.5 bg-gradient-to-t from-[#b58ce6] via-[#CBA6F7] to-white rounded-full"
            />
          );
        })}
      </div>
    );
  };

  return (
    <div
      id="visualizer"
      className="p-8 depth-card rounded-3xl flex flex-col justify-between h-full relative overflow-hidden glow-accent min-h-[480px]"
    >
      {/* Glow highlight in visualizer container */}
      <div className="absolute -top-24 -left-24 w-48 h-48 bg-[#CBA6F7]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header Info */}
      <div className="flex justify-between items-center border-b border-zinc-900 pb-4">
        <div className="flex items-center gap-2">
          <AudioLines className={`h-5 w-5 text-[#CBA6F7] ${isPlaying ? "animate-pulse" : ""}`} />
          <h3 className="font-sans font-extrabold text-sm text-white tracking-tight uppercase">
            Interactive Match Visualizer
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-400 font-semibold uppercase px-2.5 py-1 rounded-full">
            {scanState.status === "idle"
              ? "Ready"
              : scanState.status === "completed"
              ? "Synced"
              : "Analyzing"}
          </span>
        </div>
      </div>

      {/* Main Core Animated Graphic Panel */}
      <div className="my-10 flex flex-col items-center justify-center relative flex-grow">
        <AnimatePresence mode="wait">
          {scanState.status === "idle" ? (
            <motion.div
              key="idle"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center text-center"
            >
              {/* Pulsing Static Soundwave Circle with slow continuous spin */}
              <motion.div
                animate={{
                  scale: [1, 1.08, 1],
                  borderColor: ["rgba(203, 166, 247, 0.2)", "rgba(203, 166, 247, 0.6)", "rgba(203, 166, 247, 0.2)"],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="w-40 h-40 rounded-full border-2 border-dashed border-[#CBA6F7]/20 flex items-center justify-center relative mb-6 animate-[spin_10s_linear_infinite]"
              >
                <div className="w-32 h-32 rounded-full border border-zinc-800 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-[#CBA6F7]/5 flex items-center justify-center border border-[#CBA6F7]/30">
                    <Music className="h-6 w-6 text-[#CBA6F7] animate-pulse" />
                  </div>
                </div>

                {/* Simulated soundwave nodes orbiting with continuous spin */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 flex items-center justify-center animate-[spin_10s_linear_infinite]"
                >
                  <div className="absolute top-0 w-3 h-3 bg-[#CBA6F7] rounded-full shadow-[0_0_10px_rgba(203,166,247,0.8)]" />
                </motion.div>
              </motion.div>

              <p className="text-zinc-300 font-semibold text-base">AI Engine Ready</p>
              <p className="text-zinc-500 text-sm mt-1 max-w-[240px] leading-relaxed">
                Waiting for Spotify connection...
              </p>
            </motion.div>
          ) : scanState.status !== "completed" ? (
            <motion.div
              key="matching"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center text-center w-full"
            >
              {/* Actively matching orbital graphics */}
              <div className="relative w-44 h-44 flex items-center justify-center mb-8">
                {/* Orbital nodes */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 border-2 border-[#CBA6F7]/30 rounded-full border-t-transparent"
                />
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  className="absolute w-32 h-32 border-2 border-dashed border-[#CBA6F7]/20 rounded-full"
                />

                <div className="w-24 h-24 bg-zinc-900 rounded-full border border-zinc-800 flex flex-col items-center justify-center shadow-inner relative">
                  <Sparkles className="h-6 w-6 text-[#CBA6F7] animate-bounce" />
                  <span className="text-[10px] text-[#CBA6F7] mt-1 font-bold animate-pulse uppercase">AI SCANNING</span>
                </div>
              </div>

              {/* Informative text about matching steps */}
              <p className="text-[#CBA6F7] font-semibold text-base uppercase animate-pulse tracking-wide">
                {scanState.status === "connecting_spotify" && "Connecting Spotify..."}
                {scanState.status === "scanning_spotify" && "Analyzing Taste Overlaps..."}
                {scanState.status === "fetching_soundcloud" && "Parsing SoundCloud Profiles..."}
                {scanState.status === "matching" && "Finalizing Match Coefficient..."}
              </p>
              <div className="mt-3 bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-full text-xs text-zinc-400 max-w-[280px] h-8 truncate font-medium">
                {scanState.logLines[scanState.logLines.length - 1] || "Computing alignment matrices..."}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="completed"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center text-center w-full"
            >
              <div className="relative w-full flex flex-col items-center justify-center">
                {/* Active reactive soundwave visualization */}
                <div className="w-full max-w-[260px] mb-8 bg-zinc-900/40 p-4 border border-zinc-800/80 rounded-2xl relative">
                  {renderSoundwave()}

                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 rounded-full border border-zinc-800 pointer-events-none">
                    <Volume2 className="h-4 w-4 text-[#CBA6F7]" />
                  </div>
                </div>

                <div className="bg-[#CBA6F7]/10 border border-[#CBA6F7]/30 px-3 py-1 rounded-full flex items-center gap-1.5 mb-2">
                  <Sparkles className="h-3 w-3 text-[#CBA6F7]" />
                  <span className="text-[10px] text-[#CBA6F7] font-bold uppercase tracking-wider">
                    Match Index: {scanState.matchedArtist?.matchScore}%
                  </span>
                </div>

                <h4 className="font-sans font-extrabold text-xl text-white">
                  {scanState.matchedArtist?.trackName}
                </h4>
                <p className="text-zinc-400 text-sm mt-1 font-medium">
                  by {scanState.matchedArtist?.name}
                </p>
                <p className="text-xs text-zinc-500 mt-2 bg-zinc-900/80 border border-zinc-800 px-2.5 py-1 rounded-full uppercase font-medium">
                  Genre: {scanState.matchedArtist?.genre}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Media Player Control Mockup */}
      <div className="border-t border-zinc-900 pt-6">
        {/* Timeline bar */}
        <div className="flex items-center justify-between text-[11px] text-zinc-500 font-medium mb-3">
          <span>{formatTime(currentTime)}</span>
          <div className="flex-grow mx-4 h-1.5 bg-zinc-900 border border-zinc-800 rounded-full overflow-hidden relative cursor-pointer">
            <div
              className="h-full bg-gradient-to-r from-[#b58ce6] to-[#CBA6F7] rounded-full relative transition-all duration-100"
              style={{ width: `${percent}%` }}
            />
          </div>
          <span>{formatTime(duration)}</span>
        </div>

        {/* Action Controls */}
        <div className="flex justify-between items-center mt-1">
          <span className="text-[11px] text-zinc-600 font-semibold tracking-wide uppercase">
            SoundCloud Media
          </span>

          <div className="flex items-center gap-4">
            <button
              onClick={onPrevTrack}
              disabled={scanState.status !== "completed"}
              className="p-2 text-zinc-400 hover:text-[#CBA6F7] hover:bg-zinc-900 rounded-full transition-colors disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer"
            >
              <SkipBack className="h-5 w-5" />
            </button>

            <button
              onClick={onPlayToggle}
              disabled={scanState.status !== "completed"}
              className={`p-3.5 rounded-full transition-all duration-300 flex items-center justify-center cursor-pointer shadow-lg ${
                isPlaying
                  ? "bg-white text-black hover:scale-105"
                  : "bg-[#CBA6F7] text-black hover:bg-white hover:scale-105"
              } disabled:opacity-25 disabled:cursor-not-allowed`}
            >
              {isPlaying ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current" />}
            </button>

            <button
              onClick={onNextTrack}
              disabled={scanState.status !== "completed"}
              className="p-2 text-zinc-400 hover:text-[#CBA6F7] hover:bg-zinc-900 rounded-full transition-colors disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer"
            >
              <SkipForward className="h-5 w-5" />
            </button>
          </div>

          <div className="flex gap-1">
            <div className={`w-1 h-3 rounded-full ${isPlaying ? "bg-green-500 animate-pulse" : "bg-zinc-800"}`} />
            <div className={`w-1 h-3 rounded-full ${isPlaying ? "bg-green-500 animate-pulse" : "bg-zinc-800"}`} style={{ animationDelay: "0.2s" }} />
            <div className={`w-1 h-3 rounded-full ${isPlaying ? "bg-green-500 animate-pulse" : "bg-zinc-800"}`} style={{ animationDelay: "0.4s" }} />
          </div>
        </div>
      </div>
    </div>
  );
}
