import React from "react";
import { Check, Activity, Target, Flame, ClipboardCheck } from "lucide-react";

import { GradientButton } from "@/components/ui/gradient-button";

interface AssessmentProgressProps {
  currentStep: number;
  totalSteps: number;
  onStepClick?: (step: number) => void;
}

const STEPS = [
  { id: 1, label: "Activity", icon: Activity },
  { id: 2, label: "Body Area", icon: Target },
  { id: 3, label: "Symptoms", icon: Flame },
  { id: 4, label: "Review", icon: ClipboardCheck },
];

export const AssessmentProgress: React.FC<AssessmentProgressProps> = ({
  currentStep,
  totalSteps = 4,
  onStepClick,
}) => {
  const progressPercent = Math.round(((currentStep - 1) / (totalSteps - 1)) * 100);

  return (
    <div className="w-full space-y-4">
      {/* ── Top Step Indicators (01 ━━ 02 ━━ 03 ━━ 04) ──────────────────── */}
      <div className="flex items-center justify-between relative">
        {/* Background Track Line */}
        <div
          className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-[2px] bg-[#21183A] -z-0"
          aria-hidden="true"
        />

        {/* Animated Progress Line */}
        <div
          className="absolute top-1/2 left-0 -translate-y-1/2 h-[2px] bg-gradient-to-r from-[#7C3AED] via-[#FF6B6B] to-[#F97368] transition-all duration-500 ease-out -z-0 shadow-sm shadow-[#F97368]/50"
          style={{ width: `${progressPercent}%` }}
          aria-hidden="true"
        />

        {STEPS.map((step) => {
          const isCompleted = currentStep > step.id;
          const isCurrent = currentStep === step.id;
          const isClickable = Boolean(onStepClick && isCompleted);

          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center group">
              <GradientButton
                type="button"
                variant={isCurrent || isCompleted ? "default" : "variant"}
                onClick={() => isClickable && onStepClick && onStepClick(step.id)}
                disabled={!isClickable && !isCurrent}
                className={`min-w-0 w-9 h-9 sm:w-10 sm:h-10 p-0 rounded-2xl flex items-center justify-center font-bold text-xs sm:text-sm transition-all duration-300 ${
                  isCompleted
                    ? "cursor-pointer hover:scale-105"
                    : isCurrent
                    ? "scale-110 shadow-lg shadow-[#F97368]/40 animate-subtle-pulse cursor-default"
                    : "opacity-40 cursor-not-allowed"
                }`}
                aria-current={isCurrent ? "step" : undefined}
                aria-label={`Step ${step.id}: ${step.label}`}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4 stroke-[3]" />
                ) : (
                  <span>0{step.id}</span>
                )}
              </GradientButton>

              {/* Step Label */}
              <span
                className={`mt-2 text-[11px] sm:text-xs font-bold tracking-tight transition-colors duration-200 hidden sm:block ${
                  isCurrent
                    ? "text-[#FFFDF9] font-display"
                    : isCompleted
                    ? "text-[#FDBA8C]"
                    : "text-[#B8AEC8]/60"
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Mobile Current Step Label */}
      <div className="sm:hidden flex items-center justify-between text-xs font-semibold px-1 pt-1">
        <span className="text-[#B8AEC8]">
          Step 0{currentStep} of 0{totalSteps}
        </span>
        <span className="text-gradient-coral-peach font-bold font-display">
          {STEPS[currentStep - 1]?.label}
        </span>
      </div>
    </div>
  );
};

export default AssessmentProgress;
