import React, { useMemo } from "react";
import {
  X,
  Check,
  Sparkles,
  Layers,
  Info,
  Activity,
  Shield,
  CornerDownRight,
} from "lucide-react";
import { GradientButton } from "@/components/ui/gradient-button";
import {
  type AnatomyStructure,
  getRelatedStructures,
  getAnatomicalGuidanceInfo,
} from "@/data/anatomyManifest";

interface AnatomyInfoPanelProps {
  structure: AnatomyStructure | null;
  isConfirmed: boolean;
  onConfirm: (structure: AnatomyStructure) => void;
  onSelectRelated?: (structure: AnatomyStructure) => void;
  onClose: () => void;
}

export const AnatomyInfoPanel: React.FC<AnatomyInfoPanelProps> = ({
  structure,
  isConfirmed,
  onConfirm,
  onSelectRelated,
  onClose,
}) => {
  if (!structure) return null;

  const guidance = useMemo(() => {
    return getAnatomicalGuidanceInfo(structure);
  }, [structure]);

  const relatedStructures = useMemo(() => {
    return getRelatedStructures(structure);
  }, [structure]);

  return (
    <div className="w-full rounded-2xl bg-[#18132D]/95 border border-[#7C3AED]/40 backdrop-blur-2xl shadow-2xl p-4 sm:p-5 space-y-3 animate-in fade-in zoom-in-95 duration-150 text-[#FFFDF9] max-h-[80vh] overflow-y-auto">
      {/* ── Top Header with Dismiss ───────────────────────────────────── */}
      <div className="flex items-start justify-between gap-3 pb-2.5 border-b border-[#7C3AED]/20">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F97368] animate-pulse shrink-0" />
            <h3 className="text-sm sm:text-base font-extrabold text-[#FFFDF9] tracking-tight font-display uppercase truncate">
              {structure.name}
            </h3>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[11px] font-semibold text-[#B8AEC8]">
            <span className="px-2 py-0.5 rounded-md bg-[#7C3AED]/25 text-[#A78BFA] border border-[#7C3AED]/30">
              {structure.category}
            </span>
            <span>•</span>
            <span className="text-[#E9E2F5] capitalize">
              Side: {structure.side}
            </span>
            <span>•</span>
            <span className="text-[#FDBA8C]">{structure.layer} Layer</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg text-[#B8AEC8] hover:text-[#FFFDF9] hover:bg-[#21183A] transition-colors cursor-pointer shrink-0"
          aria-label="Close panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* ── Structure Scope & Biomechanical Function ──────────────────── */}
      <div className="space-y-2 text-xs text-[#B8AEC8] leading-relaxed">
        <p className="text-[#FFFDF9]/90 font-medium">
          {structure.type === "joint_region"
            ? `Joint complex spanning ${structure.meshNames.length} interconnected structures across the ${structure.name.toLowerCase()} region.`
            : structure.type === "functional_group"
            ? `Muscular functional unit comprising ${structure.meshNames.length} synergistic muscle heads.`
            : `Individual anatomical ${structure.category.toLowerCase()} situated in the ${structure.region.replace("-", " ")} region.`}
        </p>

        {structure.meshNames.length > 1 && (
          <div className="pt-0.5 text-[11px] text-[#FDBA8C] flex items-center gap-1">
            <Layers className="w-3 h-3 text-[#F97368]" />
            <span>Highlights {structure.meshNames.length} anatomical parts</span>
          </div>
        )}

        {/* Biomechanical Action Description */}
        <div className="p-2.5 rounded-xl bg-[#120D26]/80 border border-[#7C3AED]/20 space-y-1">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#FDBA8C] uppercase tracking-wider font-display">
            <Activity className="w-3.5 h-3.5 text-[#F97368]" />
            <span>Biomechanical Function</span>
          </div>
          <p className="text-[11px] text-[#B8AEC8] leading-snug">
            {guidance.action}
          </p>
        </div>

        {/* REVORA Clinical Recovery Connection */}
        <div className="p-2.5 rounded-xl bg-[#7C3AED]/15 border border-[#7C3AED]/35 space-y-1">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#A78BFA] uppercase tracking-wider font-display">
            <Shield className="w-3.5 h-3.5 text-[#8B5CF6]" />
            <span>REVORA Recovery Protocol Target</span>
          </div>
          <p className="text-[11px] text-[#FFFDF9]/90 leading-snug">
            {guidance.recoveryFocus}
          </p>
        </div>
      </div>

      {/* ── Related & Underlying Deep Structures ──────────────────────── */}
      {relatedStructures.length > 0 && onSelectRelated && (
        <div className="pt-1 space-y-1.5 border-t border-[#7C3AED]/20">
          <div className="flex items-center justify-between text-[11px] font-semibold text-[#B8AEC8]">
            <span className="flex items-center gap-1">
              <CornerDownRight className="w-3 h-3 text-[#A78BFA]" />
              <span>Underlying & Adjacent Structures:</span>
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {relatedStructures.map((rel) => (
              <button
                key={rel.id}
                type="button"
                onClick={() => onSelectRelated(rel)}
                className="px-2 py-1 rounded-lg bg-[#21183A]/90 hover:bg-[#7C3AED]/30 border border-[#7C3AED]/30 text-[10px] font-medium text-[#FFFDF9] hover:text-[#FDBA8C] transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                title={`Select ${rel.name}`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#A78BFA]" />
                <span className="truncate max-w-[140px]">{rel.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Action Buttons ────────────────────────────────────────────── */}
      <div className="pt-1.5 flex items-center gap-2">
        <GradientButton
          type="button"
          onClick={() => onConfirm(structure)}
          disabled={isConfirmed}
          className="flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 cursor-pointer"
        >
          {isConfirmed ? (
            <>
              <Check className="w-4 h-4 text-[#10B981]" />
              <span>Area Confirmed</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-[#17102F]" />
              <span>Confirm Area</span>
            </>
          )}
        </GradientButton>
      </div>

      {/* ── Non-Diagnostic Safety Note ─────────────────────────────────── */}
      <div className="text-[10px] text-[#B8AEC8]/70 flex items-start gap-1.5 pt-1 border-t border-[#7C3AED]/15">
        <Info className="w-3.5 h-3.5 text-[#A78BFA] shrink-0 mt-0.5" />
        <span>
          Recording symptom telemetry for biomechanical analysis. Not a medical diagnosis.
        </span>
      </div>
    </div>
  );
};

export default AnatomyInfoPanel;
