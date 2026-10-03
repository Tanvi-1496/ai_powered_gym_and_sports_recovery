import React from "react";
import {
  Activity,
  Calendar,
  Clock,
  Flame,
  HeartPulse,
  Layers,
  Sparkles,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { AssessmentRecord } from "@/services/assessment";
import { saveActiveAssessment } from "@/services/assessment";
import { getAnatomyLabel } from "@/data/anatomyManifest";
import { ALL_BODY_REGIONS } from "@/features/assessment/BodyMapStep";
import { GradientButton } from "@/components/ui/gradient-button";

interface RecoveryHistoryItemModalProps {
  assessment: AssessmentRecord | null;
  onClose: () => void;
}

export const RecoveryHistoryItemModal: React.FC<RecoveryHistoryItemModalProps> = ({
  assessment,
  onClose,
}) => {
  const navigate = useNavigate();

  if (!assessment) return null;

  const handleOpenInResults = () => {
    saveActiveAssessment(assessment);
    onClose();
    navigate("/results");
  };

  const handleOpenInRecovery = () => {
    saveActiveAssessment(assessment);
    onClose();
    navigate("/recovery-plan");
  };

  const formattedDate = assessment.created_at
    ? new Date(assessment.created_at).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Recent Assessment";

  const formatActivityName = () => {
    if (assessment.activity === "other" && assessment.custom_activity) {
      return assessment.custom_activity;
    }
    return assessment.activity
      ? assessment.activity.charAt(0).toUpperCase() + assessment.activity.slice(1)
      : "Not specified";
  };

  const formatDuration = (d?: string) => {
    switch (d) {
      case "<1_day": return "Less than 24 hours";
      case "1-3_days": return "1 to 3 days";
      case "4-7_days": return "4 to 7 days";
      case "1-2_weeks": return "1 to 2 weeks";
      case ">2_weeks": return "More than 2 weeks";
      default: return d || "Not specified";
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Assessment Record Details"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0D0A1F]/85 backdrop-blur-md animate-fade-in"
    >
      <div className="relative w-full max-w-2xl p-6 sm:p-8 rounded-3xl bg-[#18132D] border border-[#7C3AED]/40 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto custom-scrollbar">
        {/* Ambient Glow */}
        <div
          className="absolute -top-20 -right-20 w-52 h-52 bg-[#7C3AED]/15 rounded-full blur-3xl pointer-events-none"
          aria-hidden="true"
        />

        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#7C3AED]/20">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#7C3AED]/20 border border-[#7C3AED]/35 text-[10px] font-bold uppercase tracking-wider text-[#FDBA8C]">
              <Calendar className="w-3 h-3 text-[#F97368]" />
              <span>{formattedDate}</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold font-display text-[#FFFDF9]">
              Assessment Record
            </h3>
            <p className="text-xs text-[#B8AEC8] font-mono">
              ID: {assessment.id || "assess_local"}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-[#21183A] text-[#B8AEC8] hover:text-[#FFFDF9] border border-[#7C3AED]/20 hover:border-[#7C3AED]/50 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Structured Details Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          
          <div className="p-3.5 rounded-xl bg-[#21183A]/70 border border-[#7C3AED]/20 space-y-1">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-[#B8AEC8] tracking-wider">
              <Activity className="w-3.5 h-3.5 text-[#F97368]" />
              <span>Activity</span>
            </div>
            <p className="text-sm font-bold text-[#FFFDF9] truncate">
              {formatActivityName()}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#21183A]/70 border border-[#7C3AED]/20 space-y-1">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-[#B8AEC8] tracking-wider">
              <Flame className="w-3.5 h-3.5 text-[#FDBA8C]" />
              <span>Pain Severity</span>
            </div>
            <p className="text-sm font-bold text-[#F97368] font-mono">
              {assessment.pain_severity} / 10
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#21183A]/70 border border-[#7C3AED]/20 space-y-1 col-span-2 sm:col-span-1">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-[#B8AEC8] tracking-wider">
              <Clock className="w-3.5 h-3.5 text-[#A78BFA]" />
              <span>Duration</span>
            </div>
            <p className="text-sm font-semibold text-[#E9E2F5] truncate">
              {formatDuration(assessment.duration)}
            </p>
          </div>

        </div>

        {/* Affected Areas */}
        <div className="p-4 rounded-2xl bg-[#120D26]/80 border border-[#7C3AED]/20 space-y-2">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase text-[#FDBA8C] tracking-wider">
            <Layers className="w-3.5 h-3.5" />
            <span>Target Anatomical Zones ({assessment.body_areas.length})</span>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {(assessment.body_areas || []).map((areaId) => (
              <span
                key={areaId}
                className="px-2.5 py-1 rounded-lg bg-[#21183A] border border-[#7C3AED]/30 text-xs font-semibold text-[#FFFDF9] flex items-center gap-1.5"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#F97368]" />
                <span>{getAnatomyLabel(areaId) || ALL_BODY_REGIONS[areaId] || areaId}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Reported Symptoms */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold uppercase text-[#B8AEC8] tracking-wider block">
            Reported Symptoms
          </span>
          <div className="flex flex-wrap gap-1.5">
            {(assessment.symptoms || []).map((sym) => (
              <span
                key={sym}
                className="px-2.5 py-1 rounded-lg bg-[#21183A] border border-[#7C3AED]/20 text-xs text-[#E9E2F5] capitalize"
              >
                {sym.replace(/_/g, " ")}
              </span>
            ))}
            {assessment.custom_symptom && (
              <span className="px-2.5 py-1 rounded-lg bg-[#F97368]/15 border border-[#F97368]/30 text-xs font-semibold text-[#FDBA8C]">
                &ldquo;{assessment.custom_symptom}&rdquo;
              </span>
            )}
          </div>
        </div>

        {assessment.additional_details && (
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase text-[#B8AEC8] tracking-wider block">
              Athlete Notes
            </span>
            <p className="text-xs text-[#B8AEC8] italic bg-[#120D26]/70 p-3 rounded-xl border border-[#7C3AED]/15">
              &ldquo;{assessment.additional_details}&rdquo;
            </p>
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-4 border-t border-[#7C3AED]/20 flex flex-col sm:flex-row items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#21183A] text-xs font-semibold text-[#B8AEC8] hover:text-[#FFFDF9] border border-[#7C3AED]/20 transition-colors cursor-pointer"
          >
            Close
          </button>

          <GradientButton
            type="button"
            variant="variant"
            onClick={handleOpenInResults}
            className="w-full sm:w-auto min-w-0 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#FDBA8C]" />
            <span>Open in Results</span>
          </GradientButton>

          <GradientButton
            type="button"
            onClick={handleOpenInRecovery}
            className="w-full sm:w-auto min-w-0 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <HeartPulse className="w-3.5 h-3.5" />
            <span>View Recovery Plan</span>
          </GradientButton>
        </div>
      </div>
    </div>
  );
};
