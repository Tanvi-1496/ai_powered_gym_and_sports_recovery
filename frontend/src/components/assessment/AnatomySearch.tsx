import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Search,
  X,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import {
  searchAnatomy,
  byId,
  type AnatomyStructure,
  type ModelLayer,
} from "@/data/anatomyManifest";

interface AnatomySearchProps {
  onSelectStructure: (structure: AnatomyStructure) => void;
  selectedStructureId: string | null;
  activeLayers?: Record<ModelLayer, boolean>;
  onToggleLayer?: (layer: ModelLayer) => void;
}

export const AnatomySearch: React.FC<AnatomySearchProps> = ({
  onSelectStructure,
  selectedStructureId,
}) => {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const results = React.useMemo(() => {
    return searchAnatomy(query);
  }, [query]);

  const handleSelect = useCallback(
    (item: AnatomyStructure) => {
      onSelectStructure(item);
      setQuery("");
      setIsOpen(false);
      setHighlightedIndex(-1);
    },
    [onSelectStructure]
  );

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) {
      if (e.key === "ArrowDown" && results.length > 0) {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < results.length) {
        handleSelect(results[highlightedIndex]);
      } else if (results.length > 0) {
        handleSelect(results[0]);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  };

  // Quick Preset Search Queries for Athletes
  const QUICK_SEARCHES = [
    { id: "left_knee", label: "Left Knee" },
    { id: "right_knee", label: "Right Knee" },
    { id: "left-hamstrings", label: "Hamstrings" },
    { id: "left-quadriceps", label: "Quads" },
    { id: "left-calf", label: "Calf" },
    { id: "left-calcaneal-tendon", label: "Achilles Tendon" },
    { id: "left-rotator-cuff", label: "Rotator Cuff" },
    { id: "left_shoulder", label: "Shoulder" },
    { id: "left_ankle", label: "Ankle" },
    { id: "left_hip", label: "Hip" },
  ];

  return (
    <div ref={containerRef} className="relative w-full">
      {/* ── Search Input Field ────────────────────────────────────────── */}
      <div className="relative flex items-center">
        <Search className="absolute left-4 w-4 h-4 text-[#A78BFA] pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setHighlightedIndex(-1);
          }}
          onFocus={() => {
            if (query.trim()) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search anatomy (e.g. knee, hamstring, achilles, acl, kneecap)..."
          className="w-full pl-11 pr-10 py-2.5 rounded-2xl bg-[#18132D]/95 border border-[#7C3AED]/35 text-xs sm:text-sm font-medium text-[#FFFDF9] placeholder-[#B8AEC8]/60 focus:outline-none focus:border-[#F97368]/70 focus:ring-2 focus:ring-[#7C3AED]/30 transition-all backdrop-blur-xl shadow-lg"
          aria-label="Search anatomical structure or region"
          aria-expanded={isOpen}
          role="combobox"
          aria-autocomplete="list"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setIsOpen(false);
              setHighlightedIndex(-1);
              inputRef.current?.focus();
            }}
            className="absolute right-3 p-1 text-[#B8AEC8] hover:text-[#FFFDF9] rounded-lg transition-colors cursor-pointer"
            aria-label="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* ── Autocomplete Results Dropdown ──────────────────────────────── */}
      {isOpen && query.trim().length > 0 && (
        <div
          className="absolute z-50 left-0 right-0 mt-2 max-h-80 overflow-y-auto rounded-2xl bg-[#18132D]/98 border border-[#7C3AED]/50 shadow-2xl backdrop-blur-2xl p-2 space-y-1 animate-in fade-in slide-in-from-top-2 duration-150"
          role="listbox"
        >
          {results.length > 0 ? (
            results.map((item, idx) => {
              const isSelected = selectedStructureId === item.id;
              const isHighlighted = idx === highlightedIndex;

              const isRegionOrGroup =
                item.type === "joint_region" || item.type === "functional_group";

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs sm:text-sm flex items-center justify-between transition-all cursor-pointer ${
                    isHighlighted || isSelected
                      ? "bg-[#7C3AED]/35 text-[#FFFDF9] border border-[#F97368]/50 shadow-sm"
                      : "hover:bg-[#21183A] text-[#E9E2F5] hover:text-[#FFFDF9] border border-transparent"
                  }`}
                  role="option"
                  aria-selected={isSelected}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        isRegionOrGroup ? "bg-[#F97368]" : "bg-[#A78BFA]"
                      }`}
                    />
                    <div className="truncate">
                      <div className="font-bold text-[#FFFDF9] truncate flex items-center gap-2">
                        <span>{item.name}</span>
                        {isRegionOrGroup && (
                          <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-md bg-[#F97368]/20 text-[#FDBA8C] border border-[#F97368]/30">
                            {item.type === "joint_region" ? "Region" : "Group"}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#B8AEC8] flex items-center gap-2 mt-0.5">
                        <span className="capitalize">{item.category}</span>
                        <span>•</span>
                        <span className="text-[#A78BFA]">{item.layer} Layer</span>
                        {item.meshNames.length > 1 && (
                          <>
                            <span>•</span>
                            <span className="text-[#FDBA8C]">
                              {item.meshNames.length} meshes
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-[#B8AEC8] shrink-0" />
                </button>
              );
            })
          ) : (
            <div className="p-4 text-center text-xs text-[#B8AEC8]">
              <p>No exact anatomical match found for &ldquo;{query}&rdquo;.</p>
              <p className="mt-1 text-[11px] text-[#FDBA8C]">
                Try searching common terms (e.g. knee, hamstring, achilles, quad) or enter it manually below.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Quick Anatomy Search Chips ─────────────────────────────────── */}
      <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-1 scrollbar-none text-[11px]">
        <span className="text-[#B8AEC8] font-bold uppercase tracking-wider text-[10px] shrink-0 flex items-center gap-1 mr-0.5">
          <Sparkles className="w-3 h-3 text-[#F97368]" />
          Quick:
        </span>
        {QUICK_SEARCHES.map((tag) => {
          const struct = byId[tag.id];
          if (!struct) return null;
          const isSelected = selectedStructureId === tag.id;
          return (
            <button
              key={tag.id}
              type="button"
              onClick={() => handleSelect(struct)}
              className={`shrink-0 px-2.5 py-1 rounded-xl font-semibold transition-all cursor-pointer ${
                isSelected
                  ? "bg-[#7C3AED] text-[#FFFDF9] border border-[#F97368]/70 shadow-sm"
                  : "bg-[#18132D]/85 hover:bg-[#21183A] text-[#B8AEC8] hover:text-[#FFFDF9] border border-[#7C3AED]/25"
              }`}
            >
              {tag.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default AnatomySearch;
