import React from "react";
import { CheckCircle2, CircleDot, Lock, Sparkles } from "lucide-react";

export interface PhaseTab {
  phaseNumber: number;
  title: string;
  subtitle: string;
  status: "active" | "locked" | "completed";
}

const DEFAULT_PHASES: PhaseTab[] = [
  {
    phaseNumber: 1,
    title: "Phase 1",
    subtitle: "Preparation & Mobility",
    status: "active",
  },
  {
    phaseNumber: 2,
    title: "Phase 2",
    subtitle: "Progressive Reload",
    status: "locked",
  },
  {
    phaseNumber: 3,
    title: "Phase 3",
    subtitle: "Dynamic Conditioning",
    status: "locked",
  },
  {
    phaseNumber: 4,
    title: "Phase 4",
    subtitle: "Return to Sport",
    status: "locked",
  },
];

interface RecoveryTimelineProps {
  activePhase: number;
  onSelectPhase: (phaseNumber: number) => void;
  phases?: PhaseTab[];
}

export const RecoveryTimeline: React.FC<RecoveryTimelineProps> = ({
  activePhase,
  onSelectPhase,
  phases = DEFAULT_PHASES,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#F97368]" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#FDBA8C] font-display">
            Recovery Phase Timeline
          </h3>
        </div>
        <span className="text-xs text-[#B8AEC8]">Interactive Phase Stepper</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {phases.map((phase) => {
          const isSelected = activePhase === phase.phaseNumber;
          const isLocked = phase.status === "locked" && !isSelected;

          return (
            <button
              key={phase.phaseNumber}
              type="button"
              onClick={() => onSelectPhase(phase.phaseNumber)}
              className={`text-left p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden group cursor-pointer ${
                isSelected
                  ? "bg-gradient-to-br from-[#21183A] to-[#18132D] border-[#F97368]/60 shadow-lg shadow-[#7C3AED]/10 -translate-y-0.5"
                  : isLocked
                  ? "bg-[#18132D]/60 border-[#7C3AED]/20 hover:border-[#7C3AED]/40 hover:bg-[#18132D]"
                  : "bg-[#18132D] border-[#7C3AED]/30 hover:border-[#7C3AED]/50"
              }`}
            >
              {/* Active top highlight indicator */}
              {isSelected && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#7C3AED] via-[#F97368] to-[#FDBA8C]" />
              )}

              <div className="flex items-center justify-between mb-2">
                <span
                  className={`text-[11px] font-mono font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-lg ${
                    isSelected
                      ? "bg-[#F97368]/20 text-[#FFFDF9] border border-[#F97368]/40"
                      : "bg-[#7C3AED]/15 text-[#B8AEC8]"
                  }`}
                >
                  {phase.title}
                </span>

                <div className="flex items-center">
                  {phase.status === "completed" ? (
                    <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                  ) : isSelected ? (
                    <CircleDot className="w-4 h-4 text-[#F97368] animate-pulse" />
                  ) : (
                    <Lock className="w-3.5 h-3.5 text-[#B8AEC8]/50 group-hover:text-[#B8AEC8] transition-colors" />
                  )}
                </div>
              </div>

              <div className="space-y-0.5">
                <p
                  className={`text-xs sm:text-sm font-bold ${
                    isSelected ? "text-[#FFFDF9]" : "text-[#E9E2F5]"
                  }`}
                >
                  {phase.subtitle}
                </p>
                <p className="text-[10px] text-[#B8AEC8]">
                  {isSelected
                    ? "Active View • Awaiting Engine"
                    : "Planned Progression"}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
