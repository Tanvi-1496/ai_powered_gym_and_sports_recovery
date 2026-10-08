import React from "react";
import { Activity, Clock, HeartPulse, Layers, Workflow, Target } from "lucide-react";
import type { AssessmentData } from "@/services/assessment";
import { getAnatomyLabel } from "@/data/anatomyManifest";
import { ALL_BODY_REGIONS } from "@/features/assessment/BodyMapStep";

interface RecoveryOverviewCardProps {
  assessment: AssessmentData | null;
}

export const RecoveryOverviewCard: React.FC<RecoveryOverviewCardProps> = ({ assessment }) => {
  const formatActivity = () => {
    if (!assessment) return "Active Recovery";
    if (assessment.activity === "other" && assessment.custom_activity) {
      return assessment.custom_activity;
    }
    return assessment.activity
      ? assessment.activity.charAt(0).toUpperCase() + assessment.activity.slice(1)
      : "Active Recovery";
  };

  const primaryTargetLabel = () => {
    if (!assessment || !assessment.body_areas || assessment.body_areas.length === 0) {
      return "General Kinetic Chain";
    }
    const first = assessment.body_areas[0];
    const label = getAnatomyLabel(first) || ALL_BODY_REGIONS[first] || first;
    if (assessment.body_areas.length > 1) {
      return `${label} +${assessment.body_areas.length - 1} more`;
    }
    return label;
  };

  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#18132D] via-[#21183A] to-[#18132D] border border-[#7C3AED]/35 shadow-2xl relative overflow-hidden space-y-6">
      {/* Ambient Glows */}
      <div
        className="absolute -top-24 -left-24 w-64 h-64 bg-[#7C3AED]/20 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-24 -right-24 w-64 h-64 bg-[#F97368]/15 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      {/* Header section with engine status */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-[#7C3AED]/20 border border-[#7C3AED]/40 flex items-center justify-center">
            <Workflow className="w-5 h-5 text-[#FDBA8C]" />
          </div>
          <div>
            <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-[#FDBA8C]">
              Adaptive Protocol Pipeline
            </span>
            <h2 className="text-xl sm:text-2xl font-bold font-display text-[#FFFDF9]">
              Recovery Overview
            </h2>
          </div>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#7C3AED]/15 border border-[#7C3AED]/35 text-xs font-bold uppercase tracking-wider text-[#FDBA8C] self-start sm:self-auto">
          <HeartPulse className="w-3.5 h-3.5 text-[#F97368]" />
          <span>Recommendation Engine • Pending</span>
        </div>
      </div>

      {/* Prominent Pending Notice */}
      <div className="p-5 rounded-2xl bg-[#120D26]/75 border border-[#7C3AED]/25 relative z-10 space-y-2">
        <h3 className="text-base sm:text-lg font-bold text-[#FFFDF9] flex items-center gap-2">
          <span>Your recovery plan is ready to be generated.</span>
        </h3>
        <p className="text-xs sm:text-sm text-[#B8AEC8] leading-relaxed max-w-2xl">
          Connect the REVORA recommendation engine to populate your personalized recovery phases, progressive reload activities, and mobility protocols based on your assessment telemetry.
        </p>
      </div>

      {/* Telemetry Context Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 relative z-10">
        
        <div className="p-3.5 rounded-2xl bg-[#18132D]/90 border border-[#7C3AED]/20 space-y-1">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-[#B8AEC8] tracking-wider">
            <Activity className="w-3.5 h-3.5 text-[#F97368]" />
            <span>Target Sport</span>
          </div>
          <p className="text-sm font-bold text-[#FFFDF9] truncate">{formatActivity()}</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#18132D]/90 border border-[#7C3AED]/20 space-y-1">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-[#B8AEC8] tracking-wider">
            <Target className="w-3.5 h-3.5 text-[#FDBA8C]" />
            <span>Target Focus</span>
          </div>
          <p className="text-sm font-bold text-[#FFFDF9] truncate">{primaryTargetLabel()}</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#18132D]/90 border border-[#7C3AED]/20 space-y-1">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-[#B8AEC8] tracking-wider">
            <Layers className="w-3.5 h-3.5 text-[#A78BFA]" />
            <span>Phase Status</span>
          </div>
          <p className="text-sm font-bold text-[#FFFDF9] truncate">4 Phases (Planned)</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#18132D]/90 border border-[#7C3AED]/20 space-y-1">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-[#B8AEC8] tracking-wider">
            <Clock className="w-3.5 h-3.5 text-[#10B981]" />
            <span>Estimated Duration</span>
          </div>
          <p className="text-sm font-bold text-[#FFFDF9] truncate">Awaiting Engine</p>
        </div>

      </div>
    </div>
  );
};
