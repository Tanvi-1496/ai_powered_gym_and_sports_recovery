import React from "react";
import { Check, X, Sparkles, Eye } from "lucide-react";
import { getAnatomyLabel, byId } from "@/data/anatomyManifest";

interface ConfirmedAreasProps {
  areas: string[];
  onRemoveArea: (areaIdOrText: string) => void;
  onFocusArea?: (areaIdOrText: string) => void;
}

export const ConfirmedAreas: React.FC<ConfirmedAreasProps> = ({
  areas,
  onRemoveArea,
  onFocusArea,
}) => {
  if (!areas || areas.length === 0) {
    return null;
  }

  return (
    <div className="p-4 sm:p-5 rounded-3xl bg-[#18132D]/90 border border-[#7C3AED]/30 backdrop-blur-xl space-y-3 shadow-xl animate-in fade-in duration-200">
      <div className="flex items-center justify-between pb-2 border-b border-[#7C3AED]/15">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#F97368]" />
          <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#FDBA8C] font-display">
            Confirmed Affected Areas
          </h4>
        </div>

        <span className="text-[11px] font-mono font-bold text-[#A78BFA] bg-[#7C3AED]/20 px-2.5 py-0.5 rounded-full border border-[#8B5CF6]/30">
          {areas.length} {areas.length === 1 ? "area" : "areas"} selected
        </span>
      </div>

      <div className="flex flex-wrap gap-2 pt-0.5">
        {areas.map((areaIdOrText) => {
          const is3DStructure = Boolean(byId[areaIdOrText]);
          const isManual =
            areaIdOrText.startsWith("custom:") || (!is3DStructure && areaIdOrText.includes(" "));
          const label = getAnatomyLabel(areaIdOrText);

          return (
            <div
              key={areaIdOrText}
              className="px-3 py-2 rounded-2xl bg-gradient-to-r from-[#21183A] to-[#281C47] border border-[#F97368]/60 text-xs sm:text-sm font-bold text-[#FFFDF9] shadow-md flex items-center gap-2.5 animate-chip-pop group hover:border-[#F97368] transition-all"
            >
              <Check className="w-3.5 h-3.5 text-[#10B981] shrink-0" />

              <button
                type="button"
                onClick={() => {
                  if (onFocusArea && is3DStructure) {
                    onFocusArea(areaIdOrText);
                  }
                }}
                disabled={!is3DStructure}
                className={`text-left font-bold transition-colors ${
                  is3DStructure
                    ? "text-[#FFFDF9] hover:text-[#FDBA8C] cursor-pointer flex items-center gap-1.5"
                    : "text-[#E9E2F5] cursor-default"
                }`}
                title={
                  is3DStructure
                    ? "Click to focus view in 3D Anatomy"
                    : "Custom athlete entry"
                }
              >
                <span>{label}</span>
                {isManual && (
                  <span className="text-[10px] font-normal px-1.5 py-0.2 rounded-md bg-[#FDBA8C]/15 text-[#FDBA8C] border border-[#FDBA8C]/30">
                    Manual
                  </span>
                )}
                {is3DStructure && (
                  <Eye className="w-3 h-3 opacity-0 group-hover:opacity-70 transition-opacity text-[#A78BFA]" />
                )}
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveArea(areaIdOrText);
                }}
                className="p-1 rounded-lg text-[#B8AEC8] hover:text-[#FF6B6B] hover:bg-[#18132D] transition-colors cursor-pointer"
                aria-label={`Remove ${label}`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ConfirmedAreas;
