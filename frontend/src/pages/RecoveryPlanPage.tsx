import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowLeft,
  Calendar,
  Cpu,
  Edit3,
  PlusCircle,
  Printer,
  Sparkles,
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
import { RecoveryOverviewCard } from "@/components/recovery/RecoveryOverviewCard";
import { RecoveryTimeline } from "@/components/recovery/RecoveryTimeline";
import { RecoveryActivitiesList } from "@/components/recovery/RecoveryActivitiesList";
import { RecoveryProgressCard } from "@/components/recovery/RecoveryProgressCard";
import { RecoverySafetyCard } from "@/components/recovery/RecoverySafetyCard";
import { RecoveryLoadingOverlay } from "@/components/recovery/RecoveryLoadingOverlay";

export const RecoveryPlanPage: React.FC = () => {
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState<AssessmentData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activePhase, setActivePhase] = useState<number>(1);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [recordedAt, setRecordedAt] = useState<string>("");

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      let current = getActiveAssessment();

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


  const formatActivityName = () => {
    if (!assessment) return "Not specified";
    if (assessment.activity === "other" && assessment.custom_activity) {
      return assessment.custom_activity;
    }
    return assessment.activity
      ? assessment.activity.charAt(0).toUpperCase() + assessment.activity.slice(1)
      : "Not specified";
  };

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
          <div className="w-12 h-12 rounded-full border-4 border-[#7C3AED]/30 border-t-[#F97368] animate-spin" />
          <p className="text-sm font-semibold text-[#B8AEC8]">Loading recovery plan context...</p>
        </div>
      </AuthenticatedLayout>
    );
  }

  // ── Empty / Missing Assessment Fallback ────────────────────────────────
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
              No Active Recovery Plan Found
            </h1>
            <p className="text-sm text-[#B8AEC8] max-w-md mx-auto leading-relaxed">
              Please complete an assessment before accessing your recovery plan. Your activity, pain telemetry, and anatomical landmarks are required to build your roadmap.
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
      <div className="max-w-5xl mx-auto space-y-8 animate-page-enter pb-16">
        
        {/* ── Top Bar & Actions ────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <GradientButton
              type="button"
              variant="variant"
              onClick={() => navigate("/results")}
              className="min-w-0 px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#F97368]" />
              <span>Assessment Results</span>
            </GradientButton>

            <span className="text-xs text-[#B8AEC8] font-mono flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#7C3AED]" />
              <span>{recordedAt || "Recent Session"}</span>
            </span>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#18132D] border border-[#7C3AED]/25 text-xs font-semibold text-[#B8AEC8] hover:text-[#FFFDF9] hover:border-[#7C3AED]/50 transition-colors cursor-pointer"
              title="Print recovery plan"
            >
              <Printer className="w-3.5 h-3.5 text-[#A78BFA]" />
              <span>Print Plan</span>
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
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#7C3AED]/20 border border-[#7C3AED]/40 text-xs font-bold uppercase tracking-wider text-[#FDBA8C]">
            <Sparkles className="w-3.5 h-3.5 text-[#F97368]" />
            <span>Recovery Roadmap</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black font-display text-[#FFFDF9] tracking-tight">
            Recovery Plan
          </h1>
          <p className="text-sm sm:text-base text-[#B8AEC8]">
            Your recovery plan will appear here once the analysis engine is connected.
          </p>
        </div>

        {/* ── 1. Recovery Overview Card ─────────────────────────────────── */}
        <RecoveryOverviewCard assessment={assessment} />

        {/* ── 2. Assessment Baseline Summary (Actual User Data) ─────────── */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#18132D] border border-[#7C3AED]/25 space-y-4 shadow-lg">
          <div className="flex items-center justify-between pb-2 border-b border-[#7C3AED]/15">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#F97368]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#FDBA8C] font-display">
                Telemetry Baseline (Current Assessment)
              </h3>
            </div>
            <button
              type="button"
              onClick={() => navigate("/results")}
              className="text-xs text-[#A78BFA] hover:text-[#FFFDF9] underline flex items-center gap-1 cursor-pointer"
            >
              <span>View Full Results</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <span className="text-[10px] font-bold uppercase text-[#B8AEC8] tracking-wider block">
                Activity
              </span>
              <p className="text-sm font-bold text-[#FFFDF9] mt-0.5 truncate">
                {formatActivityName()}
              </p>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase text-[#B8AEC8] tracking-wider block">
                Pain Level
              </span>
              <p className="text-sm font-bold text-[#F97368] font-mono mt-0.5">
                {assessment.pain_severity} / 10
              </p>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase text-[#B8AEC8] tracking-wider block">
                Duration
              </span>
              <p className="text-xs sm:text-sm font-semibold text-[#E9E2F5] mt-0.5 truncate">
                {formatDuration(assessment.duration)}
              </p>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase text-[#B8AEC8] tracking-wider block">
                Movement Limitation
              </span>
              <p className="text-xs sm:text-sm font-semibold text-[#E9E2F5] mt-0.5 capitalize">
                {assessment.movement_limitation === "yes"
                  ? "Limited"
                  : assessment.movement_limitation === "no"
                  ? "None"
                  : "Mild"}
              </p>
            </div>
          </div>

          {/* Affected Areas Badges */}
          <div className="pt-2 border-t border-[#7C3AED]/15">
            <span className="text-[10px] font-bold uppercase text-[#B8AEC8] tracking-wider block mb-1.5">
              Targeted Anatomical Areas ({assessment.body_areas.length})
            </span>
            <div className="flex flex-wrap gap-1.5">
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
        </div>

        {/* ── 3. Recovery Phase Timeline Stepper ────────────────────────── */}
        <RecoveryTimeline
          activePhase={activePhase}
          onSelectPhase={(p) => setActivePhase(p)}
        />

        {/* ── 4. Main Activities & Side Progress Grid ───────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Activities Column (2 cols wide) */}
          <div className="lg:col-span-2 space-y-6">
            <RecoveryActivitiesList
              phaseNumber={activePhase}
              activities={[]}
            />
          </div>

          {/* Sidebar / Progress & Safety (1 col wide) */}
          <div className="space-y-6">
            <RecoveryProgressCard
              completedCount={0}
              totalCount={0}
            />

            <RecoverySafetyCard />
          </div>

        </div>

        {/* ── 5. Integration Roadmap Notice ────────────────────────────── */}
        <div className="p-6 rounded-3xl bg-[#18132D]/90 border border-[#7C3AED]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#FDBA8C]">
              <Cpu className="w-4 h-4 text-[#7C3AED]" />
              <span>Future Integration Point</span>
            </div>
            <p className="text-xs text-[#B8AEC8] leading-relaxed max-w-xl">
              When the REVORA Recommendation Engine is deployed, adaptive active recovery protocols, guided videos, and progressive reload sets will populate automatically into this interface.
            </p>
          </div>

          <GradientButton
            type="button"
            variant="variant"
            onClick={() => setIsGenerating(true)}
            className="min-w-0 px-4 py-2 text-xs font-bold shrink-0 cursor-pointer"
          >
            <span>Preview Generation Flow</span>
          </GradientButton>
        </div>

      </div>

      {/* ── Optional Generation Preview Transition ───────────────────── */}
      {isGenerating && (
        <RecoveryLoadingOverlay
          onComplete={() => setIsGenerating(false)}
          durationMs={1800}
        />
      )}
    </AuthenticatedLayout>
  );
};

export default RecoveryPlanPage;
