import React, { useState } from "react";
import { motion } from "motion/react";
import { Music, MapPin, Play, Heart, Star } from "lucide-react";
import { Artist } from "../types";
import { ARTISTS } from "../data";

interface ArtistDiscoverProps {
  selectedArtist: Artist | null;
  onSelectArtist: (artist: Artist) => void;
  isPlaying: boolean;
}

export default function ArtistDiscover({
  selectedArtist,
  onSelectArtist,
  isPlaying,
}: ArtistDiscoverProps) {
  const [selectedLocation, setSelectedLocation] = useState("All");

  const locations = ["All", "Bengaluru", "Gurugram", "Mumbai", "Dehradun"];

  const matchesLocation = (artistLocation: string, filter: string) => {
    if (filter === "All") return true;
    if (filter === "Bengaluru") return artistLocation.toUpperCase() === "BANGALORE";
    return artistLocation.toUpperCase() === filter.toUpperCase();
  };

  const filteredArtists = ARTISTS.filter((artist) =>
    matchesLocation(artist.location, selectedLocation)
  );

  return (
    <div
      id="roster"
      className="p-8 depth-card rounded-3xl flex flex-col justify-between h-full relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#CBA6F7]/5 rounded-full blur-2xl pointer-events-none" />

      <div>
        {/* Row of location toggles */}
        <div className="flex flex-wrap gap-2 mb-6 pb-4 border-b border-zinc-900">
          {locations.map((loc) => {
            const isActive = selectedLocation === loc;
            return (
              <button
                key={loc}
                onClick={() => setSelectedLocation(loc)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-full border transition-all duration-300 cursor-pointer ${
                  isActive
                    ? "bg-[#CBA6F7] text-black border-[#CBA6F7] shadow-[0_0_12px_rgba(203,166,247,0.4)]"
                    : "bg-transparent text-[#CBA6F7] border-[#CBA6F7]/40 hover:border-[#CBA6F7] hover:bg-[#CBA6F7]/5"
                }`}
              >
                {loc}
              </button>
            );
          })}
        </div>

        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-900 mb-6">
          <div>
            <h3 className="font-sans font-bold text-2xl text-white tracking-tight">
              Discover Independent Talent
            </h3>
            <p className="text-zinc-400 text-sm mt-1">
              Handpicked independent musicians ready to perform at your next curated event.
            </p>
          </div>
          <span className="text-xs text-zinc-500 bg-zinc-900 border border-zinc-800 px-3.5 py-1.5 rounded-full font-semibold uppercase tracking-wider shrink-0">
            Certified Live Acts
          </span>
        </div>

        {/* Dynamic Detail of Selected Artist */}
        {selectedArtist && (
          <div className="mb-6 p-5 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div className="max-w-[75%]">
              <div className="flex items-center gap-2">
                <span className="font-sans font-extrabold text-lg text-[#CBA6F7]">
                  {selectedArtist.name}
                </span>
                <span className="text-[10px] text-zinc-500 bg-zinc-900 border border-zinc-800 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wide">
                  Top Match
                </span>
              </div>
              <p className="text-gray-300 text-xs mt-2 leading-relaxed">
                {selectedArtist.bio}
              </p>
            </div>

            <div className="flex flex-col items-end text-right self-stretch justify-between sm:self-center">
              <span className="text-[10px] text-zinc-500 font-bold uppercase">Tags</span>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {selectedArtist.tags.map((tag, i) => (
                  <span key={i} className="text-[10px] font-semibold text-[#CBA6F7] bg-[#CBA6F7]/10 px-2 py-0.5 rounded-full border border-[#CBA6F7]/20 uppercase">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Row of Artist Cards */}
        {filteredArtists.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 border border-dashed border-zinc-800 rounded-2xl text-center">
            <p className="text-zinc-400 font-medium text-sm">No independent acts certified in {selectedLocation} yet.</p>
            <p className="text-zinc-600 text-xs mt-1">Our AI is actively scouting new portfolios in this region.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredArtists.slice(0, 4).map((artist) => {
              const isSelected = selectedArtist?.id === artist.id;
              return (
                <motion.div
                  key={artist.id}
                  whileHover={{ y: -6 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  onClick={() => onSelectArtist(artist)}
                  className={`flex flex-col bg-zinc-900/50 hover:bg-zinc-900 border text-left p-4 rounded-2xl cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-[0_0_15px_rgba(203,166,247,0.3)] relative overflow-hidden group ${
                    isSelected
                      ? "border-[#CBA6F7] bg-[#CBA6F7]/5 shadow-[0_4px_25px_rgba(203,166,247,0.1)]"
                      : "border-zinc-800/80 hover:border-zinc-700"
                  }`}
                >
                  {/* Grayscale Avatar with standard hover transition */}
                  <div className="relative w-full aspect-square bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden mb-4">
                    <img
                      src={artist.avatarUrl}
                      alt={artist.name}
                      referrerPolicy="no-referrer"
                      className={`w-full h-full object-cover transition-all duration-500 ${
                        isSelected
                          ? "grayscale-0 scale-105"
                          : "grayscale group-hover:grayscale-0 group-hover:scale-103"
                      }`}
                    />

                    {/* Play Overlay indicator */}
                    {isSelected && isPlaying ? (
                      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center gap-1">
                        <span className="w-1 bg-[#CBA6F7] h-6 rounded-full animate-pulse" />
                        <span className="w-1 bg-[#CBA6F7] h-10 rounded-full animate-pulse" style={{ animationDelay: "0.2s" }} />
                        <span className="w-1 bg-[#CBA6F7] h-8 rounded-full animate-pulse" style={{ animationDelay: "0.4s" }} />
                      </div>
                    ) : (
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="p-3 bg-white text-black rounded-full shadow-lg">
                          <Play className="h-4 w-4 fill-current" />
                        </div>
                      </div>
                    )}

                    {/* Rating / Genre badge */}
                    <div className="absolute top-2.5 right-2.5 bg-black/75 backdrop-blur-sm border border-zinc-800 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider text-white">
                      {artist.genre}
                    </div>
                  </div>

                  {/* Profile Details */}
                  <div className="flex flex-col justify-between flex-grow">
                    <div>
                      <h4 className="font-sans font-extrabold text-base text-white group-hover:text-[#CBA6F7] transition-colors uppercase tracking-tight truncate">
                        {artist.name}
                      </h4>
                      <p className="text-zinc-500 text-xs mt-1 font-medium flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-[#CBA6F7]" />
                        <span>{artist.location}</span>
                      </p>
                    </div>

                    {/* Action/BPM spacer */}
                    <div className="mt-4 pt-3 border-t border-zinc-800 flex justify-between items-center text-xs">
                      <span className="text-zinc-400 font-semibold">{artist.bpm} BPM</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[#CBA6F7] hover:underline font-bold">
                          {isSelected ? "Active Match" : "Select Artist"}
                        </span>
                        {/* Audio equalizer animation visible on card hover */}
                        <div className="flex items-end gap-[2.5px] h-4 w-4 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <span className="w-[3px] bg-[#CBA6F7] rounded-full animate-equalizer-bar-1" />
                          <span className="w-[3px] bg-[#CBA6F7] rounded-full animate-equalizer-bar-2" />
                          <span className="w-[3px] bg-[#CBA6F7] rounded-full animate-equalizer-bar-3" />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Decorative summary footer */}
      <div className="mt-8 pt-4 border-t border-zinc-900 flex justify-between items-center text-xs text-zinc-500">
        <span className="font-semibold">Gig Culture India • Direct Artist Booking</span>
        <span className="hidden sm:inline">SoundCloud Certified Act Database</span>
      </div>
    </div>
  );
}
