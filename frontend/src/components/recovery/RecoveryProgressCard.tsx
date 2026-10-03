import React from "react";
import { ListOrdered, TrendingUp } from "lucide-react";

interface RecoveryProgressCardProps {
  completedCount?: number;
  totalCount?: number;
}

export const RecoveryProgressCard: React.FC<RecoveryProgressCardProps> = ({
  completedCount = 0,
  totalCount = 0,
}) => {
  const hasPlan = totalCount > 0;
  const progressPct = hasPlan ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-[#18132D] border border-[#7C3AED]/25 space-y-4 shadow-lg">
      <div className="flex items-center justify-between pb-2 border-b border-[#7C3AED]/15">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#10B981]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#FDBA8C] font-display">
            Plan Progression
          </h3>
        </div>
        <span className="text-[11px] font-mono text-[#B8AEC8]">
          {hasPlan ? `${completedCount} / ${totalCount} Done` : "Pending Generation"}
        </span>
      </div>

      <div className="space-y-3">
        <div className="flex items-baseline justify-between">
          <div>
            <span className="text-2xl font-black font-mono text-[#FFFDF9]">
              {hasPlan ? `${progressPct}%` : "--"}
            </span>
            <span className="text-xs text-[#B8AEC8] block">Overall Completion</span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#7C3AED]/15 border border-[#7C3AED]/30 text-xs font-semibold text-[#E9E2F5]">
            <ListOrdered className="w-3.5 h-3.5 text-[#FDBA8C]" />
            <span>{hasPlan ? `Phase 1 Active` : `Phase 1 of 4 Planned`}</span>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div className="space-y-1">
          <div className="h-2 w-full bg-[#21183A] rounded-full overflow-hidden border border-[#7C3AED]/20">
            <div
              className="h-full bg-gradient-to-r from-[#7C3AED] via-[#F97368] to-[#10B981] transition-all duration-500 rounded-full"
              style={{ width: `${hasPlan ? progressPct : 0}%` }}
            />
          </div>
          <div className="flex justify-between text-[9px] text-[#B8AEC8] font-mono">
            <span>Phase 1 (Prep)</span>
            <span>Phase 2 (Reload)</span>
            <span>Phase 3 (Dynamic)</span>
            <span>Phase 4 (Return)</span>
          </div>
        </div>

        {!hasPlan && (
          <p className="text-[11px] text-[#B8AEC8] leading-relaxed italic bg-[#120D26]/60 p-3 rounded-xl border border-[#7C3AED]/15">
            Progress metrics and completion milestones will become active once your recovery plan is generated.
          </p>
        )}
      </div>
    </div>
  );
};
