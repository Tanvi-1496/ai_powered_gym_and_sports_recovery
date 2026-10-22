import React, { useState } from "react";
import {
  Plus,
  Edit3,
  HelpCircle,
  Sparkles,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  HelpCircle as QuestionIcon,
  Cpu,
} from "lucide-react";
import { GradientButton } from "@/components/ui/gradient-button";
import {
  interpretSymptomDescription,
  type SymptomInterpretationResponse,
} from "@/services/symptoms";

interface ManualAreaInputProps {
  onAddManualArea: (description: string, additionalAreas?: string[]) => void;
  existingAreas: string[];
}

export const ManualAreaInput: React.FC<ManualAreaInputProps> = ({
  onAddManualArea,
  existingAreas,
}) => {
  const [manualText, setManualText] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [interpretation, setInterpretation] =
    useState<SymptomInterpretationResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAnalyzeAndAdd = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = manualText.trim();
    if (!trimmed) return;

    // Check duplicate
    const alreadyExists = existingAreas.some(
      (a) =>
        a.toLowerCase() === trimmed.toLowerCase() ||
        a.toLowerCase() === `custom: ${trimmed.toLowerCase()}`
    );
    if (alreadyExists) {
      setErrorMsg("This description has already been added to your assessment.");
      return;
    }

    setIsAnalyzing(true);
    setErrorMsg(null);

    try {
      const result = await interpretSymptomDescription({ text: trimmed });
      setInterpretation(result);

      // If no clarification is needed and valid canonical areas were identified, auto-commit
      if (!result.needs_clarification && result.canonical_body_areas.length > 0) {
        onAddManualArea(`custom: ${trimmed}`, result.canonical_body_areas);
        // Reset after short visual confirmation
        setTimeout(() => {
          setManualText("");
          setInterpretation(null);
        }, 1200);
      }
    } catch (err: any) {
      console.warn("[ManualAreaInput] Gemini interpretation call failed; using direct entry fallback:", err);
      // Graceful offline fallback: commit directly as custom area
      onAddManualArea(`custom: ${trimmed}`);
      setManualText("");
      setInterpretation(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleConfirmInterpretation = () => {
    const trimmed = manualText.trim();
    if (!trimmed) return;

    const additional = interpretation?.canonical_body_areas || [];
    onAddManualArea(`custom: ${trimmed}`, additional);
    setManualText("");
    setInterpretation(null);
    setErrorMsg(null);
  };

  const handleDirectAddWithoutAI = () => {
    const trimmed = manualText.trim();
    if (!trimmed) return;
    onAddManualArea(`custom: ${trimmed}`);
    setManualText("");
    setInterpretation(null);
    setErrorMsg(null);
  };

  return (
    <div className="p-4 sm:p-5 rounded-3xl bg-[#18132D]/70 border border-[#7C3AED]/25 backdrop-blur-md space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-[#E9E2F5] font-display">
          <HelpCircle className="w-4 h-4 text-[#A78BFA]" />
          <span>Can&apos;t find your specific area on the 3D model?</span>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsExpanded(!isExpanded);
            setInterpretation(null);
            setErrorMsg(null);
          }}
          className="text-xs font-semibold text-[#FDBA8C] hover:text-[#FFFDF9] flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>{isExpanded ? "Hide Manual Entry" : "Describe in Free Text"}</span>
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-3 pt-1 animate-in fade-in slide-in-from-top-1 duration-150">
          <form onSubmit={handleAnalyzeAndAdd} className="flex flex-col sm:flex-row items-center gap-2">
            <input
              type="text"
              value={manualText}
              onChange={(e) => {
                setManualText(e.target.value);
                if (errorMsg) setErrorMsg(null);
              }}
              placeholder="e.g. My left shoulder hurts when I raise my arm above my head..."
              className="w-full sm:flex-1 px-4 py-3 rounded-2xl bg-[#120D26] border border-[#7C3AED]/35 text-xs sm:text-sm text-[#FFFDF9] placeholder-[#B8AEC8]/50 focus:outline-none focus:border-[#F97368]/70 focus:ring-2 focus:ring-[#7C3AED]/30 shadow-inner"
            />

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <GradientButton
                type="submit"
                disabled={!manualText.trim() || isAnalyzing}
                className="w-full sm:w-auto min-w-[150px] px-5 py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#FDBA8C]" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-[#FDBA8C]" />
                    <span>Interpret & Add</span>
                  </>
                )}
              </GradientButton>
            </div>
          </form>

          {/* Error Message */}
          {errorMsg && (
            <p className="text-xs text-[#FF6B6B] font-medium animate-in fade-in">
              {errorMsg}
            </p>
          )}

          {/* Structured Interpretation Card */}
          {interpretation && (
            <div className="p-4 rounded-2xl bg-[#120D26]/90 border border-[#7C3AED]/40 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-[#7C3AED]/20 pb-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#FFFDF9] font-display">
                  <Cpu className="w-3.5 h-3.5 text-[#F97368]" />
                  <span>AI Anatomical Interpretation</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#7C3AED]/20 text-[#A78BFA] border border-[#7C3AED]/30">
                    {interpretation.is_fallback ? "Rule Fallback" : interpretation.model_used || "Gemini Flash"}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-[#10B981] font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Structured</span>
                </div>
              </div>

              {/* Interpreted Items Badges */}
              <div className="space-y-2">
                {interpretation.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-[#18132D] border border-[#7C3AED]/25 flex flex-wrap items-center gap-2 text-xs"
                  >
                    <span className="px-2.5 py-1 rounded-lg bg-[#7C3AED]/30 text-[#FFFDF9] font-bold uppercase tracking-wider text-[11px]">
                      {item.canonical_body_area.replace("_", " ")}
                    </span>
                    {item.side !== "unspecified" && (
                      <span className="px-2 py-0.5 rounded-md bg-[#F97368]/20 text-[#FDBA8C] font-semibold text-[11px]">
                        Side: {item.side}
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded-md bg-[#22C55E]/15 text-[#22C55E] text-[11px]">
                      Type: {item.symptom_type}
                    </span>
                    {item.trigger && (
                      <span className="px-2 py-0.5 rounded-md bg-[#38BDF8]/15 text-[#38BDF8] text-[11px]">
                        Trigger: {item.trigger}
                      </span>
                    )}
                    {item.anatomical_structure !== "unknown" && (
                      <span className="px-2 py-0.5 rounded-md bg-[#A78BFA]/20 text-[#E9E2F5] text-[11px]">
                        Structure: {item.anatomical_structure}
                      </span>
                    )}
                    <span className="text-[10px] text-[#B8AEC8]/70 ml-auto">
                      Confidence: {Math.round(item.confidence * 100)}%
                    </span>
                  </div>
                ))}
              </div>

              {/* Clarification prompt if ambiguous */}
              {interpretation.needs_clarification && interpretation.clarifying_question && (
                <div className="p-3 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/30 flex items-start gap-2.5 text-xs text-[#FDBA8C]">
                  <QuestionIcon className="w-4 h-4 shrink-0 mt-0.5 text-[#F59E0B]" />
                  <div className="space-y-1">
                    <p className="font-bold text-[#FFFDF9]">Clarification Suggested</p>
                    <p className="text-[11px] leading-relaxed text-[#FDBA8C]/90">
                      {interpretation.clarifying_question}
                    </p>
                  </div>
                </div>
              )}

              {/* Red flag notice if detected */}
              {interpretation.red_flag_warning && (
                <div className="p-3 rounded-xl bg-[#EF4444]/15 border border-[#EF4444]/40 flex items-start gap-2.5 text-xs text-[#FF6B6B]">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[#EF4444]" />
                  <div className="space-y-1">
                    <p className="font-bold text-[#FFFDF9]">Clinical Caution Flag</p>
                    <p className="text-[11px] leading-relaxed">
                      {interpretation.red_flag_warning}
                    </p>
                  </div>
                </div>
              )}

              {/* Confirmation Actions */}
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleDirectAddWithoutAI}
                  className="px-3 py-1.5 rounded-xl text-xs text-[#B8AEC8] hover:text-[#FFFDF9] underline cursor-pointer"
                >
                  Add Raw Text Only
                </button>
                <GradientButton
                  type="button"
                  onClick={handleConfirmInterpretation}
                  className="min-w-0 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Confirm Identified Area</span>
                </GradientButton>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ManualAreaInput;
