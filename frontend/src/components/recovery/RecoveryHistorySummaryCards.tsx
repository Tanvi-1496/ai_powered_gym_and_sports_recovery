import React from "react";
import { Activity, CheckCircle2, Clock, Flame } from "lucide-react";
import type { AssessmentRecord } from "@/services/assessment";

interface RecoveryHistorySummaryCardsProps {
  assessments: AssessmentRecord[];
}

export const RecoveryHistorySummaryCards: React.FC<RecoveryHistorySummaryCardsProps> = ({
  assessments,
}) => {
  const total = assessments.length;
  const activeCount = assessments.filter((a) => a.status !== "archived").length;
  const completedCount = assessments.filter((a) => a.status === "completed").length;

  const lastDate =
    total > 0 && assessments[0]?.created_at
      ? new Date(assessments[0].created_at).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        })
      : "--";

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {/* Total Assessments */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#18132D] border border-[#7C3AED]/25 hover:border-[#7C3AED]/45 transition-all duration-300 space-y-1.5 shadow-lg hover:-translate-y-0.5">
        <div className="flex items-center justify-between text-[#B8AEC8]">
          <span className="text-[10px] font-bold uppercase tracking-wider font-mono">
            Total Sessions
          </span>
          <Activity className="w-4 h-4 text-[#F97368]" />
        </div>
        <p className="text-2xl sm:text-3xl font-black font-mono text-[#FFFDF9]">
          {total > 0 ? total : "--"}
        </p>
        <span className="text-[10px] text-[#B8AEC8] block">Recorded Assessments</span>
      </div>

      {/* Active Protocols */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#18132D] border border-[#7C3AED]/25 hover:border-[#7C3AED]/45 transition-all duration-300 space-y-1.5 shadow-lg hover:-translate-y-0.5">
        <div className="flex items-center justify-between text-[#B8AEC8]">
          <span className="text-[10px] font-bold uppercase tracking-wider font-mono">
            Active Triage
          </span>
          <Flame className="w-4 h-4 text-[#FDBA8C]" />
        </div>
        <p className="text-2xl sm:text-3xl font-black font-mono text-[#FFFDF9]">
          {total > 0 ? activeCount : "--"}
        </p>
        <span className="text-[10px] text-[#B8AEC8] block">Current Monitoring</span>
      </div>

      {/* Verified Summaries */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#18132D] border border-[#7C3AED]/25 hover:border-[#7C3AED]/45 transition-all duration-300 space-y-1.5 shadow-lg hover:-translate-y-0.5">
        <div className="flex items-center justify-between text-[#B8AEC8]">
          <span className="text-[10px] font-bold uppercase tracking-wider font-mono">
            Completed
          </span>
          <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
        </div>
        <p className="text-2xl sm:text-3xl font-black font-mono text-[#FFFDF9]">
          {total > 0 ? completedCount : "--"}
        </p>
        <span className="text-[10px] text-[#B8AEC8] block">Verified Reports</span>
      </div>

      {/* Last Assessment */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#18132D] border border-[#7C3AED]/25 hover:border-[#7C3AED]/45 transition-all duration-300 space-y-1.5 shadow-lg hover:-translate-y-0.5">
        <div className="flex items-center justify-between text-[#B8AEC8]">
          <span className="text-[10px] font-bold uppercase tracking-wider font-mono">
            Last Session
          </span>
          <Clock className="w-4 h-4 text-[#A78BFA]" />
        </div>
        <p className="text-2xl sm:text-3xl font-black font-mono text-[#FFFDF9] truncate">
          {lastDate}
        </p>
        <span className="text-[10px] text-[#B8AEC8] block">Most Recent Timestamp</span>
      </div>
    </div>
  );
};
