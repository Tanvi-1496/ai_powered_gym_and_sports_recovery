import React from "react";
import {
  Activity,
  Calendar,
  Zap,
  HelpCircle,
  Check,
  Flame,
} from "lucide-react";
import type { AssessmentData } from "@/services/assessment";
import { GradientButton } from "@/components/ui/gradient-button";

interface SymptomsStepProps {
  formData: AssessmentData;
  updateFormData: (fields: Partial<AssessmentData>) => void;
  errors: Record<string, string>;
}

const SYMPTOM_OPTIONS = [
  { id: "pain", label: "Pain", desc: "Aching, sharp, or throbbing sensation" },
  { id: "swelling", label: "Swelling", desc: "Visible puffiness or inflammation" },
  { id: "stiffness", label: "Stiffness", desc: "Tightness or reduced ease of motion" },
  { id: "weakness", label: "Weakness", desc: "Loss of muscular force or instability" },
  { id: "tenderness", label: "Tenderness", desc: "Pain when touching the area" },
  { id: "reduced_movement", label: "Reduced movement", desc: "Inability to flex or extend fully" },
  { id: "numbness_tingling", label: "Numbness / tingling", desc: "Pins and needles or loss of sensation" },
  { id: "other", label: "Other sensation", desc: "Clicking, popping, burning, etc." },
];

const DURATION_OPTIONS = [
  { id: "<1_day", label: "Less than a day" },
  { id: "1-3_days", label: "1–3 days" },
  { id: "4-7_days", label: "4–7 days" },
  { id: "1-2_weeks", label: "1–2 weeks" },
  { id: ">2_weeks", label: "More than 2 weeks" },
  { id: "not_sure", label: "Not sure" },
];

const MOVEMENT_OPTIONS = [
  { id: "yes", label: "Yes, significant difficulty" },
  { id: "no", label: "No, full movement remains" },
  { id: "not_sure", label: "Mild / Not sure" },
];

export const SymptomsStep: React.FC<SymptomsStepProps> = ({
  formData,
  updateFormData,
  errors,
}) => {
  const pain = Number(formData.pain_severity ?? 5);

  const getPainColor = (val: number) => {
    if (val <= 3) return "text-[#10B981] bg-[#10B981]/15 border-[#10B981]/40";
    if (val <= 6) return "text-[#FDBA8C] bg-[#FDBA8C]/15 border-[#FDBA8C]/40";
    return "text-[#FF6B6B] bg-[#FF6B6B]/15 border-[#FF6B6B]/40";
  };

  const getPainDescriptor = (val: number) => {
    if (val === 0) return "No Pain";
    if (val <= 3) return "Mild Discomfort";
    if (val <= 6) return "Moderate Pain";
    if (val <= 8) return "Severe Pain";
    return "Extreme / Intolerable";
  };

  const handleToggleSymptom = (symptomId: string) => {
    const current = formData.symptoms || [];
    if (current.includes(symptomId)) {
      updateFormData({ symptoms: current.filter((s) => s !== symptomId) });
    } else {
      updateFormData({ symptoms: [...current, symptomId] });
    }
  };

  const selectedSymptoms = formData.symptoms || [];

  return (
    <div className="space-y-8 animate-page-enter">
      {/* ── Section Header ────────────────────────────────────────────── */}
      <div className="space-y-1.5 text-center sm:text-left">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#FFFDF9] tracking-tight font-display">
          Tell us more about what you&apos;re feeling
        </h2>
        <p className="text-sm sm:text-base text-[#B8AEC8]">
          Detail your symptom intensity, sensations, and duration.
        </p>
      </div>

      {/* ── 1. Pain Severity Slider Card ───────────────────────────────── */}
      <div className="p-6 sm:p-7 rounded-3xl bg-[#18132D] border border-[#7C3AED]/25 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#7C3AED]/15">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#7C3AED]/20 border border-[#7C3AED]/30 flex items-center justify-center text-[#F97368]">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#FFFDF9] font-display">
                Pain Severity Level
              </h3>
              <p className="text-xs text-[#B8AEC8]">0 (No pain) to 10 (Severe pain)</p>
            </div>
          </div>

          {/* Prominent Pain Display */}
          <div className="flex items-center gap-3 self-start sm:self-auto">
            <span className="text-xs font-semibold text-[#B8AEC8] hidden sm:inline">
              {getPainDescriptor(pain)}
            </span>
            <div
              className={`px-4 py-1.5 rounded-2xl border font-mono font-extrabold text-lg sm:text-xl shadow-md transition-all duration-300 flex items-center gap-1 ${getPainColor(
                pain
              )}`}
            >
              <span>{pain}</span>
              <span className="text-xs font-normal opacity-70">/ 10</span>
            </div>
          </div>
        </div>

        {/* Custom Glowing Range Slider */}
        <div className="space-y-3 pt-2">
          <input
            type="range"
            min={0}
            max={10}
            step={1}
            value={pain}
            onChange={(e) => updateFormData({ pain_severity: Number(e.target.value) })}
            className="w-full h-3 bg-[#21183A] rounded-lg appearance-none cursor-pointer accent-[#F97368] focus:outline-none"
            aria-label="Pain severity slider from 0 to 10"
          />

          <div className="flex justify-between text-[11px] font-semibold text-[#B8AEC8] px-1">
            <span>0 (None)</span>
            <span>2 (Mild)</span>
            <span>5 (Moderate)</span>
            <span>8 (High)</span>
            <span>10 (Severe)</span>
          </div>
        </div>
      </div>

      {/* ── 2. Symptom Types Multi-Select Grid ─────────────────────────── */}
      <div className="p-6 sm:p-7 rounded-3xl bg-[#18132D] border border-[#7C3AED]/25 shadow-xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-[#7C3AED]/15">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#FDBA8C]" />
            <h3 className="text-sm sm:text-base font-bold text-[#FFFDF9] font-display">
              What are you experiencing? *
            </h3>
          </div>
          <span className="text-xs text-[#B8AEC8]">Select all that apply</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {SYMPTOM_OPTIONS.map((sym) => {
            const isSelected = selectedSymptoms.includes(sym.id);
            return (
              <GradientButton
                key={sym.id}
                type="button"
                variant={isSelected ? "default" : "variant"}
                onClick={() => handleToggleSymptom(sym.id)}
                className={`min-w-0 p-3.5 rounded-2xl text-left cursor-pointer flex flex-col justify-between items-start h-auto w-full group transition-all duration-200 ${
                  isSelected
                    ? "scale-[1.02] shadow-md shadow-[#7C3AED]/20"
                    : ""
                }`}
                aria-pressed={isSelected}
              >
                <div className="w-full flex items-center justify-between">
                  <span
                    className={`text-xs sm:text-sm font-bold ${
                      isSelected ? "text-[#FFFDF9] font-display" : "text-[#E9E2F5]"
                    }`}
                  >
                    {sym.label}
                  </span>
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${
                      isSelected
                        ? "bg-[#F97368] text-[#FFFDF9]"
                        : "bg-[#21183A] border border-[#7C3AED]/30 group-hover:border-[#8B5CF6]"
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>
                <p className="text-[11px] text-[#B8AEC8] mt-2 leading-tight text-left">{sym.desc}</p>
              </GradientButton>
            );
          })}
        </div>

        {selectedSymptoms.includes("other") && (
          <div className="pt-2 animate-step-slide-right">
            <input
              type="text"
              value={formData.custom_symptom || ""}
              onChange={(e) => updateFormData({ custom_symptom: e.target.value })}
              placeholder="Describe other sensations (e.g. popping sound, burning sensation)..."
              className="w-full rounded-xl px-4 py-2.5 text-xs sm:text-sm text-[#FFFDF9] placeholder-[#B8AEC8]/70 bg-[#21183A] border border-[#7C3AED]/30 focus:border-[#8B5CF6] outline-none"
            />
          </div>
        )}

        {errors.symptoms && (
          <p className="text-xs text-[#FF6B6B] font-medium animate-in fade-in duration-150">
            {errors.symptoms}
          </p>
        )}
      </div>

      {/* ── 3. Duration & Movement Limitations Grid ────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Duration */}
        <div className="p-6 rounded-3xl bg-[#18132D] border border-[#7C3AED]/25 shadow-xl space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#7C3AED]/15">
            <Calendar className="w-4 h-4 text-[#A78BFA]" />
            <h3 className="text-sm font-bold text-[#FFFDF9] font-display">
              How long have you had these symptoms? *
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {DURATION_OPTIONS.map((dur) => {
              const isSelected = formData.duration === dur.id;
              return (
                <GradientButton
                  key={dur.id}
                  type="button"
                  variant={isSelected ? "default" : "variant"}
                  onClick={() => updateFormData({ duration: dur.id })}
                  className="min-w-0 p-3 rounded-xl text-center text-xs font-bold cursor-pointer"
                >
                  {dur.label}
                </GradientButton>
              );
            })}
          </div>

          {errors.duration && (
            <p className="text-xs text-[#FF6B6B] font-medium">{errors.duration}</p>
          )}
        </div>

        {/* Movement Limitation */}
        <div className="p-6 rounded-3xl bg-[#18132D] border border-[#7C3AED]/25 shadow-xl space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#7C3AED]/15">
            <Zap className="w-4 h-4 text-[#F97368]" />
            <h3 className="text-sm font-bold text-[#FFFDF9] font-display">
              Difficulty moving the affected area?
            </h3>
          </div>

          <div className="space-y-2">
            {MOVEMENT_OPTIONS.map((mov) => {
              const isSelected = formData.movement_limitation === mov.id;
              return (
                <GradientButton
                  key={mov.id}
                  type="button"
                  variant={isSelected ? "default" : "variant"}
                  onClick={() => updateFormData({ movement_limitation: mov.id })}
                  className="min-w-0 w-full p-3 rounded-xl text-left text-xs font-semibold flex items-center justify-between cursor-pointer"
                >
                  <span>{mov.label}</span>
                  {isSelected && <Check className="w-4 h-4 text-[#F97368]" />}
                </GradientButton>
              );
            })}
          </div>
        </div>

      </div>

      {/* ── 4. Additional Details Textarea ─────────────────────────────── */}
      <div className="p-6 rounded-3xl bg-[#18132D] border border-[#7C3AED]/25 shadow-xl space-y-3">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-[#FDBA8C]" />
          <label
            htmlFor="additional_details"
            className="text-sm font-bold text-[#FFFDF9] font-display"
          >
            Any additional details? (Optional)
          </label>
        </div>

        <textarea
          id="additional_details"
          rows={3}
          value={formData.additional_details || ""}
          onChange={(e) => updateFormData({ additional_details: e.target.value })}
          placeholder="Describe anything else that may help us understand what you're experiencing (e.g. pain worse in the morning, swelling with weight bearing, etc.)..."
          className="w-full rounded-xl p-3.5 text-xs sm:text-sm text-[#FFFDF9] placeholder-[#B8AEC8]/70 bg-[#21183A] border border-[#7C3AED]/25 focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/30 outline-none transition-all resize-none"
        />
      </div>
    </div>
  );
};

export default SymptomsStep;
