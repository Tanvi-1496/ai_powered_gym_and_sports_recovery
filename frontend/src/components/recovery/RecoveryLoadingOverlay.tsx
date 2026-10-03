import React, { useEffect, useState } from "react";
import { Activity, CheckCircle2, Dumbbell, Shield, Sparkles } from "lucide-react";

interface RecoveryLoadingOverlayProps {
  onComplete: () => void;
  durationMs?: number;
}

const RECOVERY_GEN_STEPS = [
  {
    title: "Structuring Kinetic Load",
    description: "Analyzing reported affected areas and movement thresholds...",
    icon: Activity,
  },
  {
    title: "Synthesizing Mobility Sequences",
    description: "Preparing progressive reload drills and mobility checkpoints...",
    icon: Dumbbell,
  },
  {
    title: "Finalizing Phase Roadmap",
    description: "Organizing 4-phase timeline and safety guidelines...",
    icon: Shield,
  },
];

export const RecoveryLoadingOverlay: React.FC<RecoveryLoadingOverlayProps> = ({
  onComplete,
  durationMs = 2000,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / durationMs) * 100));
      setProgress(pct);

      if (pct < 35) {
        setCurrentStepIndex(0);
      } else if (pct < 75) {
        setCurrentStepIndex(1);
      } else {
        setCurrentStepIndex(2);
      }

      if (elapsed >= durationMs) {
        clearInterval(interval);
        setTimeout(() => {
          onComplete();
        }, 150);
      }
    }, 40);

    return () => clearInterval(interval);
  }, [durationMs, onComplete]);

  const activeStep = RECOVERY_GEN_STEPS[currentStepIndex];
  const StepIcon = activeStep.icon;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Preparing Recovery Plan"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0D0A1F]/90 backdrop-blur-md animate-fade-in"
    >
      <div className="relative w-full max-w-lg p-8 sm:p-10 rounded-3xl bg-[#18132D] border border-[#7C3AED]/40 shadow-2xl shadow-[#7C3AED]/10 text-center space-y-6 overflow-hidden">
        {/* Ambient Glows */}
        <div
          className="absolute -top-24 -left-24 w-60 h-60 bg-[#7C3AED]/20 rounded-full blur-3xl pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-24 -right-24 w-60 h-60 bg-[#F97368]/20 rounded-full blur-3xl pointer-events-none"
          aria-hidden="true"
        />

        {/* Central Animated Ring & Icon */}
        <div className="relative flex items-center justify-center mx-auto w-28 h-28">
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#7C3AED]/40 animate-spin-slow" />
          
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="44"
              className="text-[#21183A]"
              strokeWidth="6"
              stroke="currentColor"
              fill="transparent"
            />
            <circle
              cx="50"
              cy="50"
              r="44"
              className="text-[#F97368] transition-all duration-150 ease-out"
              strokeWidth="6"
              strokeDasharray={276.46}
              strokeDashoffset={276.46 - (276.46 * progress) / 100}
              strokeLinecap="round"
              stroke="url(#recoveryRingGrad)"
              fill="transparent"
            />
            <defs>
              <linearGradient id="recoveryRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#7C3AED" />
                <stop offset="50%" stopColor="#F97368" />
                <stop offset="100%" stopColor="#FDBA8C" />
              </linearGradient>
            </defs>
          </svg>

          <div className="absolute inset-3 rounded-full bg-[#21183A] border border-[#7C3AED]/40 flex items-center justify-center shadow-inner">
            <StepIcon className="w-8 h-8 text-[#FDBA8C] animate-pulse" />
          </div>
        </div>

        {/* Text Details */}
        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#7C3AED]/20 border border-[#7C3AED]/40 text-[11px] font-bold uppercase tracking-wider text-[#FDBA8C]">
            <Sparkles className="w-3.5 h-3.5 text-[#F97368] animate-spin" />
            <span>Protocol Generation</span>
          </div>

          <h3 className="text-xl sm:text-2xl font-bold font-display text-[#FFFDF9] tracking-tight">
            Preparing your recovery plan…
          </h3>

          <p className="text-xs sm:text-sm text-[#B8AEC8] max-w-sm mx-auto min-h-[40px] flex items-center justify-center">
            {activeStep.description}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2 relative z-10">
          <div className="h-1.5 w-full bg-[#21183A] rounded-full overflow-hidden border border-[#7C3AED]/20">
            <div
              className="h-full bg-gradient-to-r from-[#7C3AED] via-[#F97368] to-[#FDBA8C] transition-all duration-100 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[11px] font-mono text-[#B8AEC8]">
            <span>{activeStep.title}</span>
            <span className="font-bold text-[#FFFDF9]">{progress}%</span>
          </div>
        </div>

        {/* Stepper Status */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#7C3AED]/20">
          {RECOVERY_GEN_STEPS.map((step, idx) => {
            const isDone = idx < currentStepIndex || progress === 100;
            const isCurrent = idx === currentStepIndex && progress < 100;
            return (
              <div
                key={step.title}
                className={`p-2 rounded-xl text-left transition-all duration-300 ${
                  isCurrent
                    ? "bg-[#7C3AED]/20 border border-[#7C3AED]/40"
                    : isDone
                    ? "bg-[#18132D] border border-[#10B981]/30 opacity-80"
                    : "bg-[#18132D]/40 border border-[#7C3AED]/10 opacity-40"
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  {isDone ? (
                    <CheckCircle2 className="w-3 h-3 text-[#10B981]" />
                  ) : (
                    <div
                      className={`w-3 h-3 rounded-full border ${
                        isCurrent
                          ? "border-[#F97368] border-t-transparent animate-spin"
                          : "border-[#B8AEC8]/40"
                      }`}
                    />
                  )}
                  <span className="text-[10px] font-bold text-[#FFFDF9] truncate">
                    Step {idx + 1}
                  </span>
                </div>
                <p className="text-[9px] text-[#B8AEC8] truncate">{step.title}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
