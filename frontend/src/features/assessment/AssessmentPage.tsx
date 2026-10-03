import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { AuthenticatedLayout } from "@/components/AuthenticatedLayout";
import { AssessmentProgress } from "./AssessmentProgress";
import { ActivityStep } from "./ActivityStep";
import { BodyMapStep } from "./BodyMapStep";
import { SymptomsStep } from "./SymptomsStep";
import { ReviewStep } from "./ReviewStep";
import { AnalysisLoadingOverlay } from "@/components/assessment/AnalysisLoadingOverlay";
import {
  submitAssessment,
  saveActiveAssessment,
  getActiveAssessment,
  type AssessmentData,
} from "@/services/assessment";
import { GradientButton } from "@/components/ui/gradient-button";
import { cn } from "@/lib/utils";

export const AssessmentPage: React.FC = () => {
  const navigate = useNavigate();

  // ── Multi-Step Wizard State ──────────────────────────────────────────
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [direction, setDirection] = useState<"next" | "prev">("next");

  // ── Form State (Preserved between step transitions & loaded from cache) ─
  const [formData, setFormData] = useState<AssessmentData>(() => {
    const saved = getActiveAssessment();
    if (saved) {
      return saved;
    }
    return {
      activity: "running",
      custom_activity: "",
      activity_context: "during",
      onset_type: "sudden",
      body_areas: [],
      pain_severity: 5,
      symptoms: ["pain"],
      custom_symptom: "",
      duration: "1-3_days",
      movement_limitation: "no",
      additional_details: "",
    };
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showAnalysisLoading, setShowAnalysisLoading] = useState<boolean>(false);

  // Update form fields & sync to active cache
  const updateFormData = (fields: Partial<AssessmentData>) => {
    setFormData((prev) => {
      const updated = { ...prev, ...fields };
      saveActiveAssessment(updated);
      return updated;
    });

    // Clear field-specific error upon modification
    const fieldKeys = Object.keys(fields);
    if (fieldKeys.some((key) => errors[key])) {
      setErrors((prev) => {
        const next = { ...prev };
        fieldKeys.forEach((key) => delete next[key]);
        return next;
      });
    }
  };

  // ── Step Validation Rules ────────────────────────────────────────────
  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.activity) {
        newErrors.activity = "Please select an activity.";
      }
      if (formData.activity === "other" && !formData.custom_activity?.trim()) {
        newErrors.custom_activity = "Please specify your custom activity.";
      }
    } else if (step === 2) {
      if (!formData.body_areas || formData.body_areas.length === 0) {
        newErrors.body_areas = "Please select at least one affected body area on the map.";
      }
    } else if (step === 3) {
      if (formData.pain_severity === undefined || formData.pain_severity === null) {
        newErrors.pain_severity = "Please rate your pain level.";
      }
      if (!formData.symptoms || formData.symptoms.length === 0) {
        newErrors.symptoms = "Please select at least one symptom sensation.";
      }
      if (!formData.duration) {
        newErrors.duration = "Please specify symptom duration.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ── Step Navigation Handlers ─────────────────────────────────────────
  const handleNext = () => {
    if (!validateStep(currentStep)) return;
    setDirection("next");
    setCurrentStep((prev) => Math.min(prev + 1, 4));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePrev = () => {
    setDirection("prev");
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleStepJump = (targetStep: number) => {
    if (targetStep < currentStep || validateStep(currentStep)) {
      setDirection(targetStep > currentStep ? "next" : "prev");
      setCurrentStep(targetStep);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // ── Final Assessment Submission & Analysis Flow ──────────────────────
  const handleSubmit = async () => {
    // Validate all previous steps
    if (!validateStep(1)) {
      setCurrentStep(1);
      return;
    }
    if (!validateStep(2)) {
      setCurrentStep(2);
      return;
    }
    if (!validateStep(3)) {
      setCurrentStep(3);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    // Save active state immediately
    saveActiveAssessment(formData);

    // Trigger loading overlay transition
    setShowAnalysisLoading(true);

    try {
      // Background async persistence
      await submitAssessment(formData);
    } catch (err: unknown) {
      console.warn("[Assessment Submission] Cached locally, remote sync warning:", err);
    }
  };

  const handleAnalysisComplete = () => {
    setShowAnalysisLoading(false);
    setIsSubmitting(false);
    navigate("/results");
  };

  return (
    <AuthenticatedLayout>
      <div className="max-w-4xl mx-auto space-y-8 animate-page-enter">
        
        {/* ── Top Header & Return Link ─────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <GradientButton
            type="button"
            variant="variant"
            onClick={() => {
              if (currentStep > 1) handlePrev();
              else navigate("/dashboard");
            }}
            className="min-w-0 inline-flex items-center gap-2 text-xs sm:text-sm font-semibold px-3.5 py-1.5 rounded-full cursor-pointer"
            aria-label="Previous step"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#F97368]" />
            <span>{currentStep > 1 ? "Previous Step" : "Dashboard"}</span>
          </GradientButton>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
            <span className="text-xs font-bold font-display uppercase tracking-wider text-[#FDBA8C]">
              Interactive Assessment
            </span>
          </div>
        </div>

        {/* ── Persistent Animated Progress Tracker ─────────────────────── */}
        <div className="p-5 sm:p-6 rounded-3xl bg-[#18132D] border border-[#7C3AED]/25 shadow-xl">
          <AssessmentProgress
            currentStep={currentStep}
            totalSteps={4}
            onStepClick={handleStepJump}
          />
        </div>

        {/* ── Dynamic Step Body (Animated Transitions) ─────────────────── */}
        <div className="relative">
          <div
            key={currentStep}
            className={
              direction === "next" ? "animate-step-slide-right" : "animate-step-slide-left"
            }
          >
            {currentStep === 1 && (
              <ActivityStep
                formData={formData}
                updateFormData={updateFormData}
                errors={errors}
              />
            )}

            {currentStep === 2 && (
              <BodyMapStep
                formData={formData}
                updateFormData={updateFormData}
                errors={errors}
              />
            )}

            {currentStep === 3 && (
              <SymptomsStep
                formData={formData}
                updateFormData={updateFormData}
                errors={errors}
              />
            )}

            {currentStep === 4 && (
              <ReviewStep
                formData={formData}
                onEditStep={handleStepJump}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                submitError={submitError}
              />
            )}
          </div>
        </div>

        {/* ── Bottom Step Navigation Controls (Steps 1, 2, 3) ──────────── */}
        {currentStep < 4 && (
          <div className="pt-4 flex items-center justify-between border-t border-[#7C3AED]/15">
            <GradientButton
              type="button"
              variant="variant"
              onClick={handlePrev}
              disabled={currentStep === 1}
              className={cn(
                "min-w-0 px-5 py-3 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 cursor-pointer",
                currentStep === 1 && "opacity-0 pointer-events-none"
              )}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </GradientButton>

            <GradientButton
              type="button"
              onClick={handleNext}
              className="min-w-[132px] px-7 py-3.5 text-xs sm:text-sm font-bold flex items-center gap-2.5 cursor-pointer group"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform ml-1" />
            </GradientButton>
          </div>
        )}

      </div>

      {/* ── Analysis Loading State Modal / Overlay ───────────────────── */}
      {showAnalysisLoading && (
        <AnalysisLoadingOverlay
          onComplete={handleAnalysisComplete}
          durationMs={1800}
        />
      )}
    </AuthenticatedLayout>
  );
};

export default AssessmentPage;
