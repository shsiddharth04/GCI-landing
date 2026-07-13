import { X, SlidersHorizontal } from "lucide-react";

interface FilterBarProps {
  allGenres: string[];
  allCities: string[];
  selectedGenres: string[];
  selectedCity: string | null;
  onGenreToggle: (genre: string) => void;
  onCitySelect: (city: string | null) => void;
  onClearAll: () => void;
  resultCount: number;
}

export default function FilterBar({
  allGenres,
  allCities,
  selectedGenres,
  selectedCity,
  onGenreToggle,
  onCitySelect,
  onClearAll,
  resultCount,
}: FilterBarProps) {
  const hasFilters = selectedGenres.length > 0 || selectedCity !== null;

  return (
    <div className="w-full border-b border-zinc-900 bg-[#070708]/60 backdrop-blur-sm sticky top-[65px] z-30 py-3">
      <div className="max-w-7xl mx-auto px-6 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-zinc-400">
            <SlidersHorizontal className="h-4 w-4" />
            <span className="text-sm font-medium">
              {resultCount} artist{resultCount !== 1 ? "s" : ""}
            </span>
          </div>
          {hasFilters && (
            <button
              onClick={onClearAll}
              className="flex items-center gap-1 text-xs text-zinc-500 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
              Clear filters
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          {/* Location filter */}
          <div className="flex items-center gap-1.5 mr-2">
            <span className="text-[11px] text-zinc-600 uppercase tracking-wider font-bold">City</span>
            <select
              value={selectedCity ?? ""}
              onChange={(e) => onCitySelect(e.target.value || null)}
              className="bg-zinc-900 border border-zinc-800 focus:border-[#CBA6F7] focus:outline-none text-sm text-white rounded-full px-3 py-1.5 cursor-pointer appearance-none pr-7 transition-colors"
              style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2371717a'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center", backgroundSize: "16px" }}
            >
              <option value="">All cities</option>
              {allCities.map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          <div className="w-px h-5 bg-zinc-800" />

          {/* Genre filters */}
          <span className="text-[11px] text-zinc-600 uppercase tracking-wider font-bold ml-2">Genre</span>
          <div className="flex flex-wrap gap-2">
            {allGenres.map((genre) => {
              const active = selectedGenres.includes(genre);
              return (
                <button
                  key={genre}
                  onClick={() => onGenreToggle(genre)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 cursor-pointer ${
                    active
                      ? "bg-[#CBA6F7] text-black border-[#CBA6F7]"
                      : "bg-transparent text-zinc-400 border-zinc-800 hover:border-zinc-600 hover:text-white"
                  }`}
                >
                  {genre}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
