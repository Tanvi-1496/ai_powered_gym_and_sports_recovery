import React from "react";
import {
  Flame,
  Dumbbell,
  Trophy,
  Target,
  Waves,
  Bike,
  Sparkles,
  Check,
  Clock,
  Zap,
} from "lucide-react";
import type { AssessmentData } from "@/services/assessment";
import { GradientButton } from "@/components/ui/gradient-button";

interface ActivityStepProps {
  formData: AssessmentData;
  updateFormData: (fields: Partial<AssessmentData>) => void;
  errors: Record<string, string>;
}

const ACTIVITIES = [
  { id: "running", label: "Running", icon: Flame, desc: "Sprint, distance, trail" },
  { id: "gym", label: "Gym / Strength", icon: Dumbbell, desc: "Weights, HIIT, calisthenics" },
  { id: "football", label: "Football", icon: Trophy, desc: "Match, training, drills" },
  { id: "cricket", label: "Cricket", icon: Target, desc: "Batting, bowling, fielding" },
  { id: "swimming", label: "Swimming", icon: Waves, desc: "Laps, sprints, water polo" },
  { id: "cycling", label: "Cycling", icon: Bike, desc: "Road, spin, mountain bike" },
  { id: "other", label: "Other Activity", icon: Sparkles, desc: "Martial arts, tennis, etc." },
];

const TIMING_OPTIONS = [
  { id: "during", label: "During activity" },
  { id: "immediately_after", label: "Immediately after activity" },
  { id: "later_day", label: "Later that day" },
  { id: "next_day", label: "The next day" },
  { id: "not_sure", label: "Not sure" },
];

const ONSET_OPTIONS = [
  { id: "sudden", label: "Sudden (sharp incident)" },
  { id: "gradual", label: "Gradual (slowly built up)" },
  { id: "repeated_activity", label: "After repeated activity (overuse)" },
  { id: "not_sure", label: "Not sure" },
];

export const ActivityStep: React.FC<ActivityStepProps> = ({
  formData,
  updateFormData,
  errors,
}) => {
  return (
    <div className="space-y-8 animate-page-enter">
      {/* ── Section Header ────────────────────────────────────────────── */}
      <div className="space-y-1.5 text-center sm:text-left">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#FFFDF9] tracking-tight font-display">
          What activity were you doing?
        </h2>
        <p className="text-sm sm:text-base text-[#B8AEC8]">
          Tell us what you were doing when you noticed the problem.
        </p>
      </div>

      {/* ── Activity Cards Grid ────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {ACTIVITIES.map((act) => {
            const Icon = act.icon;
            const isSelected = formData.activity === act.id;

            return (
              <GradientButton
                key={act.id}
                type="button"
                variant={isSelected ? "default" : "variant"}
                onClick={() => updateFormData({ activity: act.id })}
                className={`min-w-0 p-4 rounded-2xl text-left cursor-pointer flex flex-col justify-between items-start h-auto w-full group transition-all duration-300 ${
                  isSelected
                    ? "scale-[1.02] shadow-lg shadow-[#7C3AED]/25"
                    : "hover:-translate-y-1 shadow-md"
                }`}
                aria-pressed={isSelected}
              >
                <div className="w-full flex items-start justify-between">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 ${
                      isSelected
                        ? "bg-[#F97368] text-[#FFFDF9] shadow-md shadow-[#F97368]/40 scale-110"
                        : "bg-[#21183A] text-[#A78BFA] group-hover:text-[#F97368] group-hover:scale-105"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-[#10B981] flex items-center justify-center text-[#FFFDF9] shadow-sm animate-chip-pop">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </div>

                <div className="mt-3.5 space-y-0.5 text-left">
                  <h3
                    className={`font-bold text-sm sm:text-base transition-colors ${
                      isSelected ? "text-[#FFFDF9] font-display" : "text-[#E9E2F5] group-hover:text-[#FFFDF9]"
                    }`}
                  >
                    {act.label}
                  </h3>
                  <p className="text-xs text-[#B8AEC8] leading-tight">{act.desc}</p>
                </div>
              </GradientButton>
            );
          })}
        </div>

        {errors.activity && (
          <p className="text-xs text-[#FF6B6B] font-medium animate-in fade-in duration-150 pl-1">
            {errors.activity}
          </p>
        )}
      </div>

      {/* ── Custom Activity Input (Animated if "Other" selected) ────────── */}
      {formData.activity === "other" && (
        <div className="p-4 sm:p-5 rounded-2xl bg-[#18132D] border border-[#7C3AED]/30 space-y-2 animate-step-slide-right">
          <label
            htmlFor="custom_activity"
            className="block text-xs font-semibold text-[#E9E2F5] uppercase tracking-wider"
          >
            Specify Your Sport or Movement *
          </label>
          <input
            id="custom_activity"
            type="text"
            value={formData.custom_activity || ""}
            onChange={(e) => updateFormData({ custom_activity: e.target.value })}
            placeholder="e.g., Badminton, Crossfit, Rowing, Rock Climbing..."
            className="w-full rounded-xl px-4 py-3 text-sm text-[#FFFDF9] placeholder-[#B8AEC8]/70 bg-[#21183A] border border-[#7C3AED]/30 focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/30 outline-none transition-all"
            autoFocus
          />
          {errors.custom_activity && (
            <p className="text-xs text-[#FF6B6B] font-medium">{errors.custom_activity}</p>
          )}
        </div>
      )}

      {/* ── Activity Context Questions ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        {/* Question 1: When did you notice it? */}
        <div className="space-y-3 p-5 rounded-2xl bg-[#18132D] border border-[#7C3AED]/20">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#FDBA8C]" />
            <h3 className="text-sm font-bold text-[#FFFDF9] font-display">
              When did you notice it?
            </h3>
          </div>

          <div className="space-y-2">
            {TIMING_OPTIONS.map((opt) => {
              const isSelected = formData.activity_context === opt.id;
              return (
                <GradientButton
                  key={opt.id}
                  type="button"
                  variant={isSelected ? "default" : "variant"}
                  onClick={() => updateFormData({ activity_context: opt.id })}
                  className="min-w-0 w-full p-3 rounded-xl text-left text-xs sm:text-sm font-medium flex items-center justify-between cursor-pointer"
                >
                  <span>{opt.label}</span>
                  {isSelected && <Check className="w-4 h-4 text-[#F97368] stroke-[2.5]" />}
                </GradientButton>
              );
            })}
          </div>
        </div>

        {/* Question 2: How did it happen? */}
        <div className="space-y-3 p-5 rounded-2xl bg-[#18132D] border border-[#7C3AED]/20">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#F97368]" />
            <h3 className="text-sm font-bold text-[#FFFDF9] font-display">
              How did it happen?
            </h3>
          </div>

          <div className="space-y-2">
            {ONSET_OPTIONS.map((opt) => {
              const isSelected = formData.onset_type === opt.id;
              return (
                <GradientButton
                  key={opt.id}
                  type="button"
                  variant={isSelected ? "default" : "variant"}
                  onClick={() => updateFormData({ onset_type: opt.id })}
                  className="min-w-0 w-full p-3 rounded-xl text-left text-xs sm:text-sm font-medium flex items-center justify-between cursor-pointer"
                >
                  <span>{opt.label}</span>
                  {isSelected && <Check className="w-4 h-4 text-[#F97368] stroke-[2.5]" />}
                </GradientButton>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityStep;
