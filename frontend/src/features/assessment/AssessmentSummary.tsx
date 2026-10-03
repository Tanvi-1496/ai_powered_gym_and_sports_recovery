import React from "react";
import { Edit3, Activity, Sparkles, Flame } from "lucide-react";
import { ALL_BODY_REGIONS } from "./BodyMapStep";
import type { AssessmentData } from "@/services/assessment";
import { GradientButton } from "@/components/ui/gradient-button";

interface AssessmentSummaryProps {
  formData: AssessmentData;
  onEditStep?: (step: number) => void;
  showEditButtons?: boolean;
}

export const AssessmentSummary: React.FC<AssessmentSummaryProps> = ({
  formData,
  onEditStep,
  showEditButtons = true,
}) => {
  const formatDuration = (d: string) => {
    switch (d) {
      case "<1_day": return "Less than a day";
      case "1-3_days": return "1–3 days";
      case "4-7_days": return "4–7 days";
      case "1-2_weeks": return "1–2 weeks";
      case ">2_weeks": return "More than 2 weeks";
      default: return d || "Not specified";
    }
  };

  const formatContext = (c: string) => {
    switch (c) {
      case "during": return "During activity";
      case "immediately_after": return "Immediately after activity";
      case "later_day": return "Later that day";
      case "next_day": return "The next day";
      default: return c || "Not specified";
    }
  };

  const formatOnset = (o: string) => {
    switch (o) {
      case "sudden": return "Sudden incident";
      case "gradual": return "Gradual buildup";
      case "repeated_activity": return "Overuse / repeated activity";
      default: return o || "Not specified";
    }
  };

  const formatActivity = () => {
    if (formData.activity === "other" && formData.custom_activity) {
      return formData.custom_activity;
    }
    return formData.activity
      ? formData.activity.charAt(0).toUpperCase() + formData.activity.slice(1)
      : "Not specified";
  };

  return (
    <div className="space-y-4">
      {/* ── 1. Activity & Context Section ──────────────────────────────── */}
      <div className="p-5 rounded-2xl bg-[#18132D] border border-[#7C3AED]/25 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#7C3AED]/15">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#F97368]" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#FDBA8C] font-display">
              Activity & Context
            </h4>
          </div>
          {showEditButtons && onEditStep && (
            <GradientButton
              type="button"
              variant="variant"
              onClick={() => onEditStep(1)}
              className="min-w-0 px-2.5 py-1 text-xs font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Edit3 className="w-3 h-3" />
              <span>Edit</span>
            </GradientButton>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <span className="text-[10px] font-bold text-[#B8AEC8] uppercase tracking-wider block">
              Sport / Activity
            </span>
            <p className="text-sm font-bold text-[#FFFDF9] mt-0.5">{formatActivity()}</p>
          </div>
          <div>
            <span className="text-[10px] font-bold text-[#B8AEC8] uppercase tracking-wider block">
              When Noticed
            </span>
            <p className="text-xs sm:text-sm font-semibold text-[#E9E2F5] mt-0.5">
              {formatContext(formData.activity_context)}
            </p>
          </div>
          <div>
            <span className="text-[10px] font-bold text-[#B8AEC8] uppercase tracking-wider block">
              Onset Pattern
            </span>
            <p className="text-xs sm:text-sm font-semibold text-[#E9E2F5] mt-0.5">
              {formatOnset(formData.onset_type)}
            </p>
          </div>
        </div>
      </div>

      {/* ── 2. Affected Body Areas Section ─────────────────────────────── */}
      <div className="p-5 rounded-2xl bg-[#18132D] border border-[#7C3AED]/25 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#7C3AED]/15">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#A78BFA]" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#FDBA8C] font-display">
              Affected Body Areas
            </h4>
          </div>
          {showEditButtons && onEditStep && (
            <GradientButton
              type="button"
              variant="variant"
              onClick={() => onEditStep(2)}
              className="min-w-0 px-2.5 py-1 text-xs font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Edit3 className="w-3 h-3" />
              <span>Edit</span>
            </GradientButton>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {(formData.body_areas || []).map((areaId) => (
            <span
              key={areaId}
              className="px-3 py-1.5 rounded-xl bg-[#21183A] border border-[#7C3AED]/30 text-xs font-bold text-[#FFFDF9] flex items-center gap-1.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#F97368]" />
              <span>{ALL_BODY_REGIONS[areaId] || areaId}</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── 3. Pain & Symptoms Section ─────────────────────────────────── */}
      <div className="p-5 rounded-2xl bg-[#18132D] border border-[#7C3AED]/25 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#7C3AED]/15">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-[#F97368]" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#FDBA8C] font-display">
              Pain & Sensations
            </h4>
          </div>
          {showEditButtons && onEditStep && (
            <GradientButton
              type="button"
              variant="variant"
              onClick={() => onEditStep(3)}
              className="min-w-0 px-2.5 py-1 text-xs font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Edit3 className="w-3 h-3" />
              <span>Edit</span>
            </GradientButton>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <span className="text-[10px] font-bold text-[#B8AEC8] uppercase tracking-wider block">
              Pain Severity
            </span>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#F97368]/15 border border-[#F97368]/30 text-sm font-mono font-extrabold text-[#FFFDF9] mt-1">
              <span>{formData.pain_severity}</span>
              <span className="text-xs font-normal opacity-70">/ 10</span>
            </div>
          </div>

          <div>
            <span className="text-[10px] font-bold text-[#B8AEC8] uppercase tracking-wider block">
              Symptom Duration
            </span>
            <p className="text-xs sm:text-sm font-semibold text-[#E9E2F5] mt-1">
              {formatDuration(formData.duration)}
            </p>
          </div>

          <div>
            <span className="text-[10px] font-bold text-[#B8AEC8] uppercase tracking-wider block">
              Movement Limitation
            </span>
            <p className="text-xs sm:text-sm font-semibold text-[#E9E2F5] mt-1 capitalize">
              {formData.movement_limitation === "yes"
                ? "Yes, limited"
                : formData.movement_limitation === "no"
                ? "No limitation"
                : "Mild / Not sure"}
            </p>
          </div>
        </div>

        {/* Symptoms Tags */}
        <div className="pt-2">
          <span className="text-[10px] font-bold text-[#B8AEC8] uppercase tracking-wider block mb-1.5">
            Reported Symptoms
          </span>
          <div className="flex flex-wrap gap-1.5">
            {(formData.symptoms || []).map((sym) => (
              <span
                key={sym}
                className="px-2.5 py-1 rounded-lg bg-[#21183A]/90 border border-[#7C3AED]/20 text-xs font-semibold text-[#E9E2F5] capitalize"
              >
                {sym.replace("_", " ")}
              </span>
            ))}
            {formData.custom_symptom && (
              <span className="px-2.5 py-1 rounded-lg bg-[#21183A]/90 border border-[#F97368]/30 text-xs font-semibold text-[#FDBA8C]">
                &ldquo;{formData.custom_symptom}&rdquo;
              </span>
            )}
          </div>
        </div>

        {formData.additional_details && (
          <div className="pt-2 border-t border-[#7C3AED]/10">
            <span className="text-[10px] font-bold text-[#B8AEC8] uppercase tracking-wider block mb-1">
              Additional Details
            </span>
            <p className="text-xs text-[#B8AEC8] italic bg-[#120D26]/60 p-3 rounded-xl border border-[#7C3AED]/15">
              &ldquo;{formData.additional_details}&rdquo;
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssessmentSummary;
