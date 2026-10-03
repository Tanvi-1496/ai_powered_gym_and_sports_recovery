import React from "react";
import { ShieldCheck, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { AssessmentSummary } from "./AssessmentSummary";
import type { AssessmentData } from "@/services/assessment";
import { GradientButton } from "@/components/ui/gradient-button";

interface ReviewStepProps {
  formData: AssessmentData;
  onEditStep: (step: number) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  submitError: string | null;
}

export const ReviewStep: React.FC<ReviewStepProps> = ({
  formData,
  onEditStep,
  onSubmit,
  isSubmitting,
  submitError,
}) => {
  return (
    <div className="space-y-8 animate-page-enter">
      {/* ── Section Header ────────────────────────────────────────────── */}
      <div className="space-y-1.5 text-center sm:text-left">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#FFFDF9] tracking-tight font-display">
          Review your assessment
        </h2>
        <p className="text-sm sm:text-base text-[#B8AEC8]">
          Confirm your telemetry inputs before submitting for biomechanical analysis.
        </p>
      </div>

      {/* ── Structured Summary View ───────────────────────────────────── */}
      <AssessmentSummary
        formData={formData}
        onEditStep={onEditStep}
        showEditButtons={!isSubmitting}
      />

      {/* ── Submission Error Alert ─────────────────────────────────────── */}
      {submitError && (
        <div className="p-4 rounded-2xl bg-[#FF6B6B]/15 border border-[#FF6B6B]/30 text-xs sm:text-sm text-[#FF6B6B] flex items-center justify-between gap-3 animate-in fade-in">
          <p className="font-medium">
            Unable to submit your assessment: {submitError}
          </p>
          <GradientButton
            type="button"
            variant="variant"
            onClick={onSubmit}
            className="min-w-0 px-3.5 py-1.5 rounded-xl font-bold text-xs shrink-0 cursor-pointer"
          >
            Try Again
          </GradientButton>
        </div>
      )}

      {/* ── Safety Notice ──────────────────────────────────────────────── */}
      <div className="p-4 rounded-2xl bg-[#18132D]/70 border border-[#7C3AED]/20 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-[#FDBA8C] shrink-0 mt-0.5" />
        <p className="text-xs text-[#B8AEC8] leading-relaxed">
          <strong className="text-[#FFFDF9]">Preliminary Assessment:</strong> REVORA structures your symptoms and biomechanical inputs to provide smart triage. This preliminary assessment is not a certified medical diagnosis.
        </p>
      </div>

      {/* ── Primary Submit CTA ─────────────────────────────────────────── */}
      <div className="pt-3 flex flex-col sm:flex-row items-center justify-end gap-3">
        <GradientButton
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="w-full sm:w-auto min-w-[200px] px-8 py-4 rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60 disabled:pointer-events-none group"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin text-[#FFFDF9]" />
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 text-[#FDBA8C]" />
              <span>Analyze My Symptoms</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
            </>
          )}
        </GradientButton>
      </div>
    </div>
  );
};

export default ReviewStep;
