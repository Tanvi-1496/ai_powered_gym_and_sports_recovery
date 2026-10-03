import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Cpu,
  Edit3,
  Flame,
  Layers,
  MoveRight,
  PlusCircle,
  Printer,
  Shield,
  Sparkles,
  Zap,
} from "lucide-react";
import { AuthenticatedLayout } from "@/components/AuthenticatedLayout";
import { GradientButton } from "@/components/ui/gradient-button";
import {
  getActiveAssessment,
  getLatestAssessment,
  clearActiveAssessment,
  type AssessmentData,
} from "@/services/assessment";
import { getAnatomyLabel } from "@/data/anatomyManifest";
import { ALL_BODY_REGIONS } from "@/features/assessment/BodyMapStep";

export const AssessmentResultsPage: React.FC = () => {
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState<AssessmentData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [recordedAt, setRecordedAt] = useState<string>("");

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      // 1. Try active in-memory session cache first
      let current = getActiveAssessment();
      
      // 2. If not found, try retrieving latest saved record from Supabase / localStorage
      if (!current) {
        const latest = await getLatestAssessment();
        if (latest) {
          current = latest;
          if (latest.created_at) {
            setRecordedAt(
              new Date(latest.created_at).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            );
          }
        }
      }

      if (!recordedAt && current) {
        setRecordedAt(
          new Date().toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        );
      }

      setAssessment(current);
      setLoading(false);
    }

    loadData();
  }, [recordedAt]);

  const handleStartNewAssessment = () => {
    clearActiveAssessment();
    navigate("/assessment");
  };

  const handlePrint = () => {
    window.print();
  };

  // Formatters
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

  const formatContext = (c?: string) => {
    switch (c) {
      case "during": return "During activity";
      case "immediately_after": return "Immediately after activity";
      case "later_day": return "Later that day";
      case "next_day": return "The following day";
      default: return c || "Not specified";
    }
  };

  const formatOnset = (o?: string) => {
    switch (o) {
      case "sudden": return "Sudden acute incident";
      case "gradual": return "Gradual buildup over time";
      case "repeated_activity": return "Overuse from repeated movement";
      default: return o || "Not specified";
    }
  };

  const formatActivityName = () => {
    if (!assessment) return "Not specified";
    if (assessment.activity === "other" && assessment.custom_activity) {
      return assessment.custom_activity;
    }
    return assessment.activity
      ? assessment.activity.charAt(0).toUpperCase() + assessment.activity.slice(1)
      : "Not specified";
  };

  const getPainLevelLabel = (score: number) => {
    if (score === 0) return "No Pain";
    if (score <= 3) return "Mild Discomfort";
    if (score <= 6) return "Moderate Pain";
    if (score <= 8) return "Severe Pain";
    return "Extreme Pain";
  };

  const getPainColor = (score: number) => {
    if (score <= 3) return "text-[#10B981]";
    if (score <= 6) return "text-[#FDBA8C]";
    return "text-[#F97368]";
  };

  const getPainBg = (score: number) => {
    if (score <= 3) return "bg-[#10B981]/15 border-[#10B981]/30";
    if (score <= 6) return "bg-[#FDBA8C]/15 border-[#FDBA8C]/30";
    return "bg-[#F97368]/15 border-[#F97368]/30";
  };

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
          <div className="w-12 h-12 rounded-full border-4 border-[#7C3AED]/30 border-t-[#F97368] animate-spin" />
          <p className="text-sm font-semibold text-[#B8AEC8]">Loading your assessment results...</p>
        </div>
      </AuthenticatedLayout>
    );
  }

  // ── Missing Data / Empty State ──────────────────────────────────────────
  if (!assessment) {
    return (
      <AuthenticatedLayout>
        <div className="max-w-2xl mx-auto py-12 px-4 text-center space-y-6 animate-page-enter">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-[#18132D] border border-[#7C3AED]/30 flex items-center justify-center shadow-xl">
            <Activity className="w-10 h-10 text-[#F97368]" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#7C3AED]/15 border border-[#7C3AED]/30 text-xs font-bold uppercase tracking-wider text-[#FDBA8C]">
              <span>Assessment Required</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-[#FFFDF9] tracking-tight">
              No Assessment Data Found
            </h1>
            <p className="text-sm text-[#B8AEC8] max-w-md mx-auto leading-relaxed">
              Please complete your assessment before analyzing your symptoms. Once submitted, your structured assessment summary and future prediction telemetry will be displayed here.
            </p>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <GradientButton
              type="button"
              onClick={() => navigate("/assessment")}
              className="w-full sm:w-auto px-7 py-3.5 text-sm font-bold flex items-center justify-center gap-2 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Start New Assessment</span>
            </GradientButton>

            <GradientButton
              type="button"
              variant="variant"
              onClick={() => navigate("/dashboard")}
              className="w-full sm:w-auto px-6 py-3.5 text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Dashboard</span>
            </GradientButton>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-5xl mx-auto space-y-8 animate-page-enter pb-12">
        
        {/* ── Top Bar & Actions ────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <GradientButton
              type="button"
              variant="variant"
              onClick={() => navigate("/dashboard")}
              className="min-w-0 px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#F97368]" />
              <span>Dashboard</span>
            </GradientButton>

            <span className="text-xs text-[#B8AEC8] font-mono flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#7C3AED]" />
              <span>{recordedAt || "Recorded recently"}</span>
            </span>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#18132D] border border-[#7C3AED]/25 text-xs font-semibold text-[#B8AEC8] hover:text-[#FFFDF9] hover:border-[#7C3AED]/50 transition-colors cursor-pointer"
              title="Print assessment report"
            >
              <Printer className="w-3.5 h-3.5 text-[#A78BFA]" />
              <span>Print Summary</span>
            </button>

            <GradientButton
              type="button"
              variant="variant"
              onClick={() => navigate("/assessment")}
              className="min-w-0 px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-[#FDBA8C]" />
              <span>Edit Assessment</span>
            </GradientButton>

            <GradientButton
              type="button"
              onClick={handleStartNewAssessment}
              className="min-w-0 px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>New Assessment</span>
            </GradientButton>
          </div>
        </div>

        {/* ── Page Header ─────────────────────────────────────────────── */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#18132D] via-[#21183A] to-[#18132D] border border-[#7C3AED]/30 shadow-2xl relative overflow-hidden">
          {/* Ambient Glows */}
          <div
            className="absolute -top-20 -right-20 w-64 h-64 bg-[#7C3AED]/20 rounded-full blur-3xl pointer-events-none"
            aria-hidden="true"
          />
          <div
            className="absolute -bottom-20 -left-20 w-64 h-64 bg-[#F97368]/15 rounded-full blur-3xl pointer-events-none"
            aria-hidden="true"
          />

          <div className="relative z-10 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#10B981]/15 border border-[#10B981]/30 text-xs font-bold uppercase tracking-wider text-[#10B981]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Telemetry Verified</span>
            </div>

            <div className="space-y-1">
              <h1 className="text-3xl sm:text-4xl font-black font-display text-[#FFFDF9] tracking-tight">
                Assessment Results
              </h1>
              <p className="text-sm sm:text-base text-[#B8AEC8]">
                Your assessment summary & preliminary biomechanical telemetry.
              </p>
            </div>
          </div>
        </div>

        {/* ── SECTION 1 — ASSESSMENT SUMMARY (User-Entered Data) ────────── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#F97368]" />
              <h2 className="text-lg sm:text-xl font-bold font-display text-[#FFFDF9]">
                Section 1 — Assessment Summary
              </h2>
            </div>
            <span className="text-xs text-[#B8AEC8]">Athlete-Reported Inputs</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* Card 1: Sport & Context */}
            <div className="p-5 rounded-2xl bg-[#18132D] border border-[#7C3AED]/25 hover:border-[#7C3AED]/45 transition-all duration-300 space-y-3 hover:-translate-y-0.5 shadow-lg">
              <div className="flex items-center gap-2 pb-2 border-b border-[#7C3AED]/15">
                <Activity className="w-4 h-4 text-[#F97368]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#FDBA8C] font-display">
                  Activity & Timing
                </h3>
              </div>
              <div className="space-y-2">
                <div>
                  <span className="text-[10px] font-bold uppercase text-[#B8AEC8] tracking-wider block">
                    Sport / Activity
                  </span>
                  <p className="text-base font-bold text-[#FFFDF9] mt-0.5">
                    {formatActivityName()}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-[#B8AEC8] tracking-wider block">
                      Timing
                    </span>
                    <p className="text-xs font-semibold text-[#E9E2F5] mt-0.5">
                      {formatContext(assessment.activity_context)}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-[#B8AEC8] tracking-wider block">
                      Onset
                    </span>
                    <p className="text-xs font-semibold text-[#E9E2F5] mt-0.5">
                      {formatOnset(assessment.onset_type)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Pain Severity */}
            <div className="p-5 rounded-2xl bg-[#18132D] border border-[#7C3AED]/25 hover:border-[#7C3AED]/45 transition-all duration-300 space-y-3 hover:-translate-y-0.5 shadow-lg">
              <div className="flex items-center gap-2 pb-2 border-b border-[#7C3AED]/15">
                <Flame className="w-4 h-4 text-[#F97368]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#FDBA8C] font-display">
                  Pain Severity
                </h3>
              </div>
              <div className="space-y-2.5">
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-black font-mono text-[#FFFDF9]">
                    {assessment.pain_severity} <span className="text-sm text-[#B8AEC8] font-normal">/ 10</span>
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border ${getPainBg(
                      assessment.pain_severity
                    )} ${getPainColor(assessment.pain_severity)}`}
                  >
                    {getPainLevelLabel(assessment.pain_severity)}
                  </span>
                </div>

                {/* Progress bar visual for pain */}
                <div className="space-y-1">
                  <div className="h-2 w-full bg-[#21183A] rounded-full overflow-hidden border border-[#7C3AED]/20">
                    <div
                      className="h-full bg-gradient-to-r from-[#10B981] via-[#FDBA8C] to-[#F97368] transition-all duration-500 rounded-full"
                      style={{ width: `${(assessment.pain_severity / 10) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] text-[#B8AEC8] font-mono">
                    <span>0 (Mild)</span>
                    <span>5 (Moderate)</span>
                    <span>10 (Severe)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Duration & Movement Restriction */}
            <div className="p-5 rounded-2xl bg-[#18132D] border border-[#7C3AED]/25 hover:border-[#7C3AED]/45 transition-all duration-300 space-y-3 hover:-translate-y-0.5 shadow-lg">
              <div className="flex items-center gap-2 pb-2 border-b border-[#7C3AED]/15">
                <Clock className="w-4 h-4 text-[#A78BFA]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#FDBA8C] font-display">
                  Timeline & Impact
                </h3>
              </div>
              <div className="space-y-2">
                <div>
                  <span className="text-[10px] font-bold uppercase text-[#B8AEC8] tracking-wider block">
                    Symptom Duration
                  </span>
                  <p className="text-sm font-semibold text-[#FFFDF9] mt-0.5">
                    {formatDuration(assessment.duration)}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-[#B8AEC8] tracking-wider block">
                    Movement Limitation
                  </span>
                  <div className="mt-1">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${
                        assessment.movement_limitation === "yes"
                          ? "bg-[#F97368]/15 border-[#F97368]/30 text-[#F97368]"
                          : assessment.movement_limitation === "no"
                          ? "bg-[#10B981]/15 border-[#10B981]/30 text-[#10B981]"
                          : "bg-[#FDBA8C]/15 border-[#FDBA8C]/30 text-[#FDBA8C]"
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      <span>
                        {assessment.movement_limitation === "yes"
                          ? "Yes, Movement is Restricted"
                          : assessment.movement_limitation === "no"
                          ? "No Movement Limitation"
                          : "Mild / Uncertain"}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Affected Anatomical Zones Detailed Card */}
          <div className="p-5 sm:p-6 rounded-2xl bg-[#18132D] border border-[#7C3AED]/25 space-y-3 shadow-lg">
            <div className="flex items-center justify-between pb-2 border-b border-[#7C3AED]/15">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#FDBA8C]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#FDBA8C] font-display">
                  Affected Anatomical Structures & Regions ({assessment.body_areas.length})
                </h3>
              </div>
              <span className="text-[11px] text-[#B8AEC8]">3D Model & Manual Tags</span>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {(assessment.body_areas || []).map((areaId) => {
                const label = getAnatomyLabel(areaId) || ALL_BODY_REGIONS[areaId] || areaId;
                return (
                  <div
                    key={areaId}
                    className="px-3.5 py-2 rounded-xl bg-[#21183A] border border-[#7C3AED]/35 text-xs font-bold text-[#FFFDF9] flex items-center gap-2 shadow-sm hover:border-[#F97368]/50 transition-colors"
                  >
                    <span className="w-2 h-2 rounded-full bg-[#F97368] shrink-0" />
                    <span>{label}</span>
                  </div>
                );
              })}
              {(!assessment.body_areas || assessment.body_areas.length === 0) && (
                <p className="text-xs text-[#B8AEC8] italic">No specific anatomy selected.</p>
              )}
            </div>
          </div>

          {/* Reported Symptoms & Additional Clinical Notes */}
          <div className="p-5 sm:p-6 rounded-2xl bg-[#18132D] border border-[#7C3AED]/25 space-y-4 shadow-lg">
            <div>
              <span className="text-[10px] font-bold uppercase text-[#B8AEC8] tracking-wider block mb-2">
                Reported Symptom Sensations
              </span>
              <div className="flex flex-wrap gap-2">
                {(assessment.symptoms || []).map((sym) => (
                  <span
                    key={sym}
                    className="px-3 py-1.5 rounded-xl bg-[#21183A] border border-[#7C3AED]/25 text-xs font-medium text-[#E9E2F5] capitalize flex items-center gap-1.5"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#7C3AED]" />
                    <span>{sym.replace(/_/g, " ")}</span>
                  </span>
                ))}
                {assessment.custom_symptom && (
                  <span className="px-3 py-1.5 rounded-xl bg-[#F97368]/15 border border-[#F97368]/30 text-xs font-semibold text-[#FDBA8C]">
                    &ldquo;{assessment.custom_symptom}&rdquo;
                  </span>
                )}
              </div>
            </div>

            {assessment.additional_details && (
              <div className="pt-3 border-t border-[#7C3AED]/15">
                <span className="text-[10px] font-bold uppercase text-[#B8AEC8] tracking-wider block mb-1">
                  Athlete Notes & Subjective Details
                </span>
                <p className="text-xs sm:text-sm text-[#B8AEC8] bg-[#120D26]/70 p-3.5 rounded-xl border border-[#7C3AED]/20 italic leading-relaxed">
                  &ldquo;{assessment.additional_details}&rdquo;
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── SECTION 2 — ANALYSIS RESULT (Future ML Output Area) ───────── */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#7C3AED]" />
              <h2 className="text-lg sm:text-xl font-bold font-display text-[#FFFDF9]">
                Section 2 — Analysis Result
              </h2>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#7C3AED]/20 border border-[#7C3AED]/35 text-[10px] font-bold uppercase tracking-wider text-[#FDBA8C]">
              <span>Future ML Engine</span>
            </div>
          </div>

          <div className="p-6 sm:p-8 rounded-3xl bg-[#18132D]/95 border-2 border-dashed border-[#7C3AED]/35 shadow-xl relative overflow-hidden space-y-6 text-center">
            {/* Ambient pattern */}
            <div
              className="absolute inset-0 bg-gradient-to-b from-[#7C3AED]/5 to-transparent pointer-events-none"
              aria-hidden="true"
            />

            <div className="w-16 h-16 mx-auto rounded-2xl bg-[#21183A] border border-[#7C3AED]/40 flex items-center justify-center shadow-lg relative z-10">
              <Cpu className="w-8 h-8 text-[#FDBA8C]" />
            </div>

            <div className="max-w-lg mx-auto space-y-2 relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#7C3AED]/15 border border-[#7C3AED]/30 text-xs font-bold uppercase tracking-wider text-[#FDBA8C]">
                <Sparkles className="w-3.5 h-3.5 text-[#F97368]" />
                <span>REVORA Prediction Engine • Integration Pending</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold font-display text-[#FFFDF9] tracking-tight">
                Personalized analysis will appear here once the REVORA prediction engine is connected.
              </h3>
              <p className="text-xs sm:text-sm text-[#B8AEC8] leading-relaxed">
                Biomechanical risk scores, neural pattern classification, and injury risk stratification models will populate this section when activated in the upcoming intelligence release.
              </p>
            </div>

            {/* Model Architecture Ready Metadata */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-[#7C3AED]/20 text-left relative z-10">
              <div className="p-3 rounded-xl bg-[#21183A]/70 border border-[#7C3AED]/20">
                <span className="text-[10px] font-mono uppercase text-[#B8AEC8] block">Inference Engine</span>
                <span className="text-xs font-bold text-[#FFFDF9] mt-0.5 block">REVORA Biomech v2</span>
              </div>
              <div className="p-3 rounded-xl bg-[#21183A]/70 border border-[#7C3AED]/20">
                <span className="text-[10px] font-mono uppercase text-[#B8AEC8] block">Pipeline Mode</span>
                <span className="text-xs font-bold text-[#FDBA8C] mt-0.5 block">Multi-Zone Triage</span>
              </div>
              <div className="p-3 rounded-xl bg-[#21183A]/70 border border-[#7C3AED]/20">
                <span className="text-[10px] font-mono uppercase text-[#B8AEC8] block">Prediction Status</span>
                <span className="text-xs font-bold text-[#10B981] mt-0.5 block">Awaiting Model Hook</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── SECTION 3 — CONTRIBUTING FACTORS (Future Model Feature Weights) ── */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#FDBA8C]" />
              <h2 className="text-lg sm:text-xl font-bold font-display text-[#FFFDF9]">
                Section 3 — Contributing Factors
              </h2>
            </div>
            <span className="text-xs text-[#B8AEC8]">Biomechanical Weights</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-[#18132D] border border-[#7C3AED]/25 space-y-2 opacity-85">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#B8AEC8]">
                <Zap className="w-4 h-4 text-[#FDBA8C]" />
                <span>Workload Modality</span>
              </div>
              <p className="text-xs text-[#B8AEC8] leading-relaxed">
                Activity kinetic demand ({formatActivityName()}) will be weighed against athlete volume and frequency when the engine is linked.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#18132D] border border-[#7C3AED]/25 space-y-2 opacity-85">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#B8AEC8]">
                <Layers className="w-4 h-4 text-[#A78BFA]" />
                <span>Kinetic Chain Stress</span>
              </div>
              <p className="text-xs text-[#B8AEC8] leading-relaxed">
                Anatomical load on {assessment.body_areas.length} reported zones will be correlated with movement restriction data.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#18132D] border border-[#7C3AED]/25 space-y-2 opacity-85">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#B8AEC8]">
                <Shield className="w-4 h-4 text-[#10B981]" />
                <span>Symptom Velocity</span>
              </div>
              <p className="text-xs text-[#B8AEC8] leading-relaxed">
                Pain intensity ({assessment.pain_severity}/10) and duration pattern ({formatDuration(assessment.duration)}) will drive recovery timeframe estimation.
              </p>
            </div>
          </div>
        </div>

        {/* ── SECTION 4 — NEXT STEP (Recovery Plan CTA) ────────────────── */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
              <h2 className="text-lg sm:text-xl font-bold font-display text-[#FFFDF9]">
                Section 4 — Next Steps
              </h2>
            </div>
            <span className="text-xs text-[#B8AEC8]">Protocol Generation</span>
          </div>

          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#18132D] via-[#21183A] to-[#18132D] border border-[#7C3AED]/35 shadow-xl space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FDBA8C]/15 border border-[#FDBA8C]/30 text-xs font-bold uppercase tracking-wider text-[#FDBA8C]">
                  <span>Recovery Roadmap</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold font-display text-[#FFFDF9] tracking-tight">
                  Your personalized recovery plan will be available after analysis.
                </h3>
                <p className="text-xs sm:text-sm text-[#B8AEC8] leading-relaxed">
                  Tailored active recovery protocols, guided mobility routines, and progressive reload schedules will be generated directly from your assessment telemetry.
                </p>
              </div>

              <div className="w-full md:w-auto flex flex-col items-center sm:items-end gap-2 shrink-0">
                <GradientButton
                  type="button"
                  onClick={() => navigate("/recovery-plan")}
                  className="w-full sm:w-auto min-w-[220px] px-6 py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 cursor-pointer group"
                >
                  <span>View Recovery Plan</span>
                  <MoveRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </GradientButton>
                <span className="text-[11px] font-medium text-[#FDBA8C]/80">
                  Explore Recovery Plan Interface
                </span>
              </div>
            </div>

            {/* Safety Disclaimer Footer */}
            <div className="pt-4 border-t border-[#7C3AED]/20 flex items-start gap-3 text-xs text-[#B8AEC8]">
              <Shield className="w-4 h-4 text-[#FDBA8C] shrink-0 mt-0.5" />
              <p>
                <strong className="text-[#FFFDF9]">Athletic Guidance Notice:</strong> REVORA assessment summaries and telemetry provide educational triage for athletic recovery and training management. Always consult a certified sports medicine physician or physical therapist for clinical medical diagnoses.
              </p>
            </div>
          </div>
        </div>

      </div>
    </AuthenticatedLayout>
  );
};

export default AssessmentResultsPage;
