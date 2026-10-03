import React, { useState } from "react";
import { Plus, Edit3, HelpCircle } from "lucide-react";
import { GradientButton } from "@/components/ui/gradient-button";

interface ManualAreaInputProps {
  onAddManualArea: (description: string) => void;
  existingAreas: string[];
}

export const ManualAreaInput: React.FC<ManualAreaInputProps> = ({
  onAddManualArea,
  existingAreas,
}) => {
  const [manualText, setManualText] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  const handleAdd = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = manualText.trim();
    if (!trimmed) return;

    // Avoid duplicates
    const alreadyExists = existingAreas.some(
      (a) =>
        a.toLowerCase() === trimmed.toLowerCase() ||
        a.toLowerCase() === `custom: ${trimmed.toLowerCase()}`
    );

    if (!alreadyExists) {
      onAddManualArea(`custom: ${trimmed}`);
    }
    setManualText("");
  };

  return (
    <div className="p-4 sm:p-5 rounded-3xl bg-[#18132D]/70 border border-[#7C3AED]/25 backdrop-blur-md space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-[#E9E2F5] font-display">
          <HelpCircle className="w-4 h-4 text-[#A78BFA]" />
          <span>Can&apos;t find your specific area on the 3D model?</span>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs font-semibold text-[#FDBA8C] hover:text-[#FFFDF9] flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>{isExpanded ? "Hide Manual Entry" : "Enter Free Text"}</span>
        </button>
      </div>

      {isExpanded && (
        <form
          onSubmit={handleAdd}
          className="flex flex-col sm:flex-row items-center gap-2 pt-1 animate-in fade-in slide-in-from-top-1 duration-150"
        >
          <input
            type="text"
            value={manualText}
            onChange={(e) => setManualText(e.target.value)}
            placeholder="e.g. Upper right calf near Achilles, pain around shoulder blade..."
            className="w-full sm:flex-1 px-4 py-3 rounded-2xl bg-[#120D26] border border-[#7C3AED]/35 text-xs sm:text-sm text-[#FFFDF9] placeholder-[#B8AEC8]/50 focus:outline-none focus:border-[#F97368]/70 focus:ring-2 focus:ring-[#7C3AED]/30 shadow-inner"
          />

          <GradientButton
            type="submit"
            disabled={!manualText.trim()}
            className="w-full sm:w-auto min-w-[130px] px-5 py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
          >
            <Plus className="w-4 h-4" />
            <span>Add Manual Area</span>
          </GradientButton>
        </form>
      )}
    </div>
  );
};

export default ManualAreaInput;
