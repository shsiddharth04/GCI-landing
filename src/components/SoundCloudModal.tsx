import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Radio, ArrowRight, Check, Music4, ShieldAlert } from "lucide-react";
import { MUSICAL_VIBES } from "../data";

interface SoundCloudModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectVibe: (vibeId: string) => void;
}

export default function SoundCloudModal({ isOpen, onClose, onSelectVibe }: SoundCloudModalProps) {
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (id: string) => {
    setSelected(id);
  };

  const handleProceed = () => {
    if (selected) {
      onSelectVibe(selected);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.85 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/90 backdrop-blur-md"
          />

          {/* Modal Box */}
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 15 }}
            transition={{ type: "spring", duration: 0.4 }}
            className="relative w-full max-w-xl bg-zinc-950 border border-zinc-800 p-6 sm:p-8 rounded-3xl text-white z-10 glow-accent"
          >
            {/* Header */}
            <div className="flex justify-between items-center pb-4 border-b border-zinc-900">
              <div className="flex items-center gap-2">
                <Music4 className="h-5 w-5 text-[#CBA6F7] animate-pulse" />
                <span className="text-xs font-semibold tracking-wider text-[#CBA6F7] uppercase">SOUNDCLOUD ARTIST SETUP</span>
              </div>
              <button
                onClick={onClose}
                className="text-zinc-400 hover:text-white p-1 hover:bg-zinc-900 rounded-full transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="mt-6">
              <h3 className="font-sans font-bold text-2xl text-white tracking-tight">
                Connect SoundCloud Portfolio
              </h3>
              <p className="text-sm text-gray-300 mt-2 leading-relaxed">
                Analyze your audio tracks to build your matching DNA. Choose your signature sound vibe to join our automated gig matching queue.
              </p>

              {/* Vibe Selection Options */}
              <div className="mt-6 space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {MUSICAL_VIBES.map((vibe) => {
                  const isSelected = selected === vibe.id;
                  return (
                    <button
                      key={vibe.id}
                      onClick={() => handleSelect(vibe.id)}
                      className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between ${
                        isSelected
                          ? "bg-[#CBA6F7] text-black border-[#CBA6F7]"
                          : "bg-zinc-900/50 text-white border-zinc-800 hover:border-[#CBA6F7]/50 hover:bg-zinc-900"
                      }`}
                    >
                      <div className="flex flex-col gap-1 pr-4">
                        <span className="font-sans font-bold text-sm tracking-wide">{vibe.name} Profile</span>
                        <span className={`text-xs leading-normal ${isSelected ? "text-zinc-800" : "text-zinc-400"}`}>
                          Match with hosts wanting: {vibe.desc}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* Tags */}
                        <div className="hidden sm:flex gap-1.5 mr-2">
                          {vibe.tags.slice(0, 1).map((tag, i) => (
                            <span
                              key={i}
                              className={`text-[9px] font-semibold border px-2 py-0.5 rounded-full ${
                                isSelected ? "border-black/30 text-black/80 bg-black/5" : "border-zinc-800 text-zinc-400"
                              }`}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>

                        {/* Radio Checkbox */}
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${isSelected ? "border-black bg-black" : "border-zinc-700"}`}>
                          {isSelected && <Check className="h-3 w-3 text-[#CBA6F7]" />}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-8 pt-5 border-t border-zinc-900 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-1.5 text-zinc-500">
                <ShieldAlert className="h-3.5 w-3.5 text-zinc-500" />
                <span className="text-[11px] font-medium uppercase tracking-wide">
                  Ironclad Contract Guarantee Active
                </span>
              </div>
              <button
                disabled={!selected}
                onClick={handleProceed}
                className={`w-full sm:w-auto px-6 py-3 font-semibold text-sm rounded-full transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
                  selected
                    ? "bg-[#CBA6F7] text-black hover:bg-white hover:shadow-lg"
                    : "bg-zinc-900 text-zinc-600 border border-zinc-800 cursor-not-allowed"
                }`}
              >
                <span>Synchronize & Launch Play</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
