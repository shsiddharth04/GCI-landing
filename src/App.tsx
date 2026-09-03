import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ShieldCheck, Mail, Send, Radio, Sparkles, AlertCircle } from "lucide-react";
import { Analytics } from "@vercel/analytics/react";

import Header from "./components/Header";
import Hero from "./components/Hero";
import HowItWorks from "./components/HowItWorks";
import ForArtists from "./components/ForArtists";
import TrustBanner from "./components/TrustBanner";
import SpotifyModal from "./components/SpotifyModal";
import SoundCloudModal from "./components/SoundCloudModal";
import InteractiveVisualizer from "./components/InteractiveVisualizer";
import ArtistDiscover from "./components/ArtistDiscover";
import SoftAurora from "./components/SoftAurora";

import { ScanState, Artist, ScanStatus } from "./types";
import { ARTISTS, MOCK_TERMINAL_LOGS, MUSICAL_VIBES } from "./data";

export default function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isArtistModalOpen, setIsArtistModalOpen] = useState(false);
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(ARTISTS[0]); // default loads Sandunes
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration] = useState(240); // 4-minute mock track progress
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);

  const [scanState, setScanState] = useState<ScanState>({
    status: "idle",
    selectedVibe: null,
    matchScore: 98.4,
    matchedArtist: ARTISTS[0],
    logLines: [],
  });

  // Playback timer progression
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= duration) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, duration]);

  // Handle manual selection from roster cards
  const handleSelectArtist = (artist: Artist) => {
    setSelectedArtist(artist);
    setIsPlaying(false);
    setCurrentTime(0);

    // Sync match visualizer state immediately
    setScanState((prev) => ({
      ...prev,
      status: "completed",
      matchedArtist: artist,
    }));
  };

  // Skip and Prev media deck controls
  const handleNextTrack = () => {
    if (!selectedArtist) return;
    const currentIdx = ARTISTS.findIndex((a) => a.id === selectedArtist.id);
    const nextIdx = (currentIdx + 1) % ARTISTS.length;
    handleSelectArtist(ARTISTS[nextIdx]);
  };

  const handlePrevTrack = () => {
    if (!selectedArtist) return;
    const currentIdx = ARTISTS.findIndex((a) => a.id === selectedArtist.id);
    const prevIdx = (currentIdx - 1 + ARTISTS.length) % ARTISTS.length;
    handleSelectArtist(ARTISTS[prevIdx]);
  };

  const handlePlayToggle = () => {
    if (selectedArtist) {
      setIsPlaying(!isPlaying);
    }
  };

  // Match Status mapping helper for simulated loading timelines
  const getStatusForStep = (step: number): ScanStatus => {
    if (step <= 1) return "connecting_spotify";
    if (step <= 4) return "scanning_spotify";
    if (step <= 6) return "fetching_soundcloud";
    if (step <= 8) return "matching";
    return "completed";
  };

  // Start matching algorithm sequence
  const handleLaunchMatcher = (vibeId: string) => {
    const selectedVibe = MUSICAL_VIBES.find((v) => v.id === vibeId);
    const matchedArtist = ARTISTS.find((a) => a.vibeType === vibeId) || ARTISTS[0];
    const logs = MOCK_TERMINAL_LOGS[vibeId] || [];

    // Reset current audio playback
    setIsPlaying(false);
    setCurrentTime(0);

    setScanState({
      status: "connecting_spotify",
      selectedVibe: selectedVibe?.name || null,
      matchScore: matchedArtist.matchScore,
      matchedArtist: null,
      logLines: [logs[0] || "Initiating digital taste fingerprint handshake..."],
    });

    let currentStep = 1;
    const timer = setInterval(() => {
      if (currentStep < logs.length) {
        setScanState((prev) => {
          const status = getStatusForStep(currentStep);
          return {
            ...prev,
            status,
            logLines: [...prev.logLines, logs[currentStep]],
          };
        });
        currentStep++;
      } else {
        clearInterval(timer);
        // Completed matching successfully!
        setScanState((prev) => ({
          ...prev,
          status: "completed",
          matchedArtist,
        }));
        setSelectedArtist(matchedArtist);
        setIsPlaying(true); // Automatically play sound for premium excitement
      }
    }, 700);
  };

  const handleLaunchArtistMatcher = (vibeId: string) => {
    const selectedVibe = MUSICAL_VIBES.find((v) => v.id === vibeId);
    const matchedArtist = ARTISTS.find((a) => a.vibeType === vibeId) || ARTISTS[0];
    const artistLogs = [
      "Establishing secure SoundCloud handshake...",
      "Analyzing waveform characteristics...",
      "Scanning regional event demands...",
      "Drafting smart contract pre-authorizations...",
      "Matching with verified host queries...",
      "Secure link finalized. You are live on the roster!"
    ];

    setIsPlaying(false);
    setCurrentTime(0);

    setScanState({
      status: "connecting_spotify",
      selectedVibe: selectedVibe?.name || null,
      matchScore: matchedArtist.matchScore,
      matchedArtist: null,
      logLines: [artistLogs[0]],
    });

    let currentStep = 1;
    const timer = setInterval(() => {
      if (currentStep < artistLogs.length) {
        setScanState((prev) => {
          let status: ScanStatus = "connecting_spotify";
          if (currentStep <= 1) status = "connecting_spotify";
          else if (currentStep <= 3) status = "scanning_spotify";
          else if (currentStep <= 4) status = "fetching_soundcloud";
          else status = "matching";
          return {
            ...prev,
            status,
            logLines: [...prev.logLines, artistLogs[currentStep]],
          };
        });
        currentStep++;
      } else {
        clearInterval(timer);
        setScanState((prev) => ({
          ...prev,
          status: "completed",
          matchedArtist,
        }));
        setSelectedArtist(matchedArtist);
        setIsPlaying(true);
      }
    }, 700);
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail.trim()) {
      setIsSubscribed(true);
      setTimeout(() => {
        setIsSubscribed(false);
        setNewsletterEmail("");
      }, 3500);
    }
  };

  return (
    <div className="min-h-screen bg-[#070708] text-white relative flex flex-col font-sans overflow-x-hidden antialiased selection:bg-[#CBA6F7] selection:text-black">
      {/* Interactive Soft Aurora Ambient Background */}
      <div className="absolute top-0 left-0 w-full h-[680px] overflow-hidden pointer-events-none opacity-45 mix-blend-screen z-0">
        <SoftAurora
          speed={0.5}
          scale={1.4}
          brightness={0.85}
          color1="#CBA6F7"
          color2="#89b4fa"
          noiseFrequency={2.2}
          noiseAmplitude={1.0}
          bandHeight={0.3}
          bandSpread={1.2}
          octaveDecay={0.15}
          layerOffset={0.2}
          colorSpeed={0.8}
          enableMouseInteraction={true}
          mouseInfluence={0.3}
        />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#070708] to-transparent pointer-events-none" />
      </div>

      {/* Absolute layered ambient depth background */}
      <div className="absolute inset-0 grid-overlay opacity-55 pointer-events-none z-0" />
      <div className="absolute top-1/10 left-[-150px] w-[600px] h-[600px] bg-[#CBA6F7]/12 rounded-full blur-[120px] pointer-events-none z-0 animate-float-slow" />
      <div className="absolute top-1/2 right-[-150px] w-[700px] h-[700px] bg-purple-600/10 rounded-full blur-[140px] pointer-events-none z-0 animate-float-reverse" />
      <div className="absolute bottom-1/10 left-1/4 w-[450px] h-[450px] bg-blue-600/8 rounded-full blur-[110px] pointer-events-none z-0 animate-float-slow" />

      {/* Top ambient color-blend strip */}
      <div className="h-1 bg-gradient-to-r from-[#CBA6F7] via-zinc-900 to-[#CBA6F7]/40 w-full relative z-10" />

      {/* 1. Navigation/Header */}
      <Header />

      {/* 2. Hero Section */}
      <Hero
        onConnectClick={() => setIsModalOpen(true)}
        onArtistConnectClick={() => setIsArtistModalOpen(true)}
        scanStatus={scanState.status}
      />

      {/* Trust & Security Banner */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        <TrustBanner />
      </motion.div>

      {/* 3. How It Works Section */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <HowItWorks />
      </motion.div>

      {/* For Artists Section */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <ForArtists />
      </motion.div>

      {/* 4 & 5. Layout Grid Panel wrapper */}
      <motion.section
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-7xl mx-auto px-6 py-12 border-t border-zinc-900"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Artist Discovery (Bottom Left Panel) */}
          <div className="col-span-12 lg:col-span-7 flex flex-col">
            <ArtistDiscover
              selectedArtist={selectedArtist}
              onSelectArtist={handleSelectArtist}
              isPlaying={isPlaying}
            />
          </div>

          {/* Interactive Match Visualizer (Bottom Right Panel) */}
          <div className="col-span-12 lg:col-span-5 flex flex-col">
            <InteractiveVisualizer
              scanState={scanState}
              isPlaying={isPlaying}
              onPlayToggle={handlePlayToggle}
              onNextTrack={handleNextTrack}
              onPrevTrack={handlePrevTrack}
              currentTime={currentTime}
              duration={duration}
            />
          </div>

        </div>
      </motion.section>

      {/* Premium Newsletter Callout */}
      <motion.section
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-7xl mx-auto px-6 py-16 border-t border-zinc-900"
      >
        <div className="bg-gradient-to-r from-zinc-950 to-zinc-900/60 p-8 sm:p-12 rounded-3xl border border-zinc-800/80 flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden">
          <div className="absolute top-1/2 left-0 -translate-y-1/2 w-64 h-64 bg-[#CBA6F7]/5 rounded-full blur-[100px] pointer-events-none" />
          
          <div className="max-w-xl z-10">
            <span className="text-[#CBA6F7] text-xs font-extrabold uppercase tracking-widest block mb-2">
              Weekly curated indie releases
            </span>
            <h3 className="font-sans font-bold text-2xl text-white tracking-tight">
              Join the Gig Culture Wire
            </h3>
            <p className="text-gray-300 text-sm mt-2 leading-relaxed">
              Receive raw reports on trending underground music circles, new certified independent rosters, and direct hosting invitations weekly.
            </p>
          </div>

          <form onSubmit={handleNewsletterSubmit} className="w-full md:w-auto md:min-w-[400px] z-10 flex gap-3">
            <input
              type="email"
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              placeholder="Enter your email address"
              required
              className="flex-grow bg-zinc-900 border border-zinc-800 focus:border-[#CBA6F7] focus:outline-none rounded-full px-5 py-3 text-sm text-white placeholder-zinc-600 transition-colors"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-[#CBA6F7] hover:bg-white text-black font-semibold text-sm rounded-full transition-all duration-300 flex items-center gap-2 cursor-pointer shrink-0"
            >
              <span>{isSubscribed ? "Joined" : "Subscribe"}</span>
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </motion.section>

      {/* Premium legal and standard footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1 }}
        className="bg-black py-12 border-t border-zinc-900 px-6 mt-auto"
      >
        <div className="w-full max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col gap-1.5 text-xs text-zinc-500">
            <span className="font-sans font-bold text-sm text-[#CBA6F7]">GIG CULTURE INDIA</span>
            <span>© 2026 GCI Multiverse Systems Inc. All rights reserved.</span>
            <span>Designed for premium indie live music curation & booking.</span>
          </div>

          <div className="flex flex-wrap gap-6 items-center text-xs text-zinc-400 font-medium">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Developer Portal</a>
            <div className="flex items-center gap-1.5 text-[#CBA6F7] border border-[#CBA6F7]/20 bg-[#CBA6F7]/5 px-3 py-1 rounded-full">
              <ShieldCheck className="h-4 w-4" />
              <span className="font-bold text-[10px] tracking-wide uppercase">OAUTH-SAFE GATEWAY</span>
            </div>
          </div>
        </div>
      </motion.footer>

      {/* Spotify Handshake modal */}
      <SpotifyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelectVibe={handleLaunchMatcher}
      />

      {/* SoundCloud Handshake modal */}
      <SoundCloudModal
        isOpen={isArtistModalOpen}
        onClose={() => setIsArtistModalOpen(false)}
        onSelectVibe={handleLaunchArtistMatcher}
      />
      
      {/* Vercel Web Analytics */}
      <Analytics />
    </div>
  );
}
