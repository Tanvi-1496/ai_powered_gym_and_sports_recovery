import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowLeft,
  Calendar,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  Layers,
  Compass,
  Clock,
  ChevronRight,
  AlertCircle,
  PlusCircle,
} from "lucide-react";
import { AuthenticatedLayout } from "@/components/AuthenticatedLayout";
import { GradientButton } from "@/components/ui/gradient-button";
import { useAuth } from "@/context/AuthContext";
import {
  getActiveAssessment,
  getLatestAssessment,
  type AssessmentData,
} from "@/services/assessment";
import {
  getPersonalizedRecoveryPlan,
  getCompletedActivityIds,
  saveCompletedActivityIds,
  type RecoveryPlanResponse,
  type RecoveryPhase,
} from "@/services/recovery";
import { getAnatomyLabel } from "@/data/anatomyManifest";
import { ALL_BODY_REGIONS } from "@/features/assessment/BodyMapStep";
import { RecoveryActivitiesList } from "@/components/recovery/RecoveryActivitiesList";

export const RecoveryPlanPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // State management
  const [assessment, setAssessment] = useState<AssessmentData | null>(null);
  const [plan, setPlan] = useState<RecoveryPlanResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [planError, setPlanError] = useState<string | null>(null);
  const [activePhaseNumber, setActivePhaseNumber] = useState<number>(1);
  const [recordedAt, setRecordedAt] = useState<string>("");
  const [completedActivityIds, setCompletedActivityIds] = useState<string[]>([]);

  // Load saved completed activities from user-scoped storage
  useEffect(() => {
    if (user?.id) {
      const saved = getCompletedActivityIds(user.id);
      setCompletedActivityIds(saved);
    }
  }, [user?.id]);

  // Fetch recovery plan from backend service
  const fetchPlan = useCallback(async () => {
    try {
      setLoading(true);
      setPlanError(null);
      const data = await getPersonalizedRecoveryPlan();
      setPlan(data);
      if (data?.currentPhaseNumber) {
        setActivePhaseNumber(data.currentPhaseNumber);
      }
    } catch (err: any) {
      console.warn("[RecoveryPlanPage] Failed to fetch recovery plan:", err);
      setPlanError(
        err?.response?.data?.detail ||
          err?.message ||
          "Unable to load recovery plan. Please verify your connection or try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial assessment and plan loading
  useEffect(() => {
    async function initData() {
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
          })
        );
      }

      setAssessment(current);
      await fetchPlan();
    }

    initData();
  }, [fetchPlan]);

  // Toggle activity completion and persist immediately per user
  const handleToggleComplete = useCallback(
    (activityId: string) => {
      if (!user?.id) return;
      setCompletedActivityIds((prev) => {
        const updated = prev.includes(activityId)
          ? prev.filter((id) => id !== activityId)
          : [...prev, activityId];
        saveCompletedActivityIds(user.id, updated);
        return updated;
      });
    },
    [user?.id]
  );

  // Derive flat list of all plan activities for overall progress
  const allActivities = useMemo(() => {
    if (!plan?.phases) return [];
    return plan.phases.flatMap((p) => p.activities || []);
  }, [plan?.phases]);

  const totalActivitiesCount = allActivities.length;

  const completedActivitiesCount = useMemo(() => {
    if (totalActivitiesCount === 0) return 0;
    const allIds = new Set(allActivities.map((a) => a.id));
    return completedActivityIds.filter((id) => allIds.has(id)).length;
  }, [allActivities, completedActivityIds, totalActivitiesCount]);

  const completionPercentage = useMemo(() => {
    if (totalActivitiesCount === 0) return 0;
    return Math.min(100, Math.round((completedActivitiesCount / totalActivitiesCount) * 100));
  }, [completedActivitiesCount, totalActivitiesCount]);

  // Derive currently active phase object
  const activePhaseData: RecoveryPhase | null = useMemo(() => {
    if (!plan?.phases || plan.phases.length === 0) return null;
    return (
      plan.phases.find((p) => p.phaseNumber === activePhaseNumber) ||
      plan.phases[0] ||
      null
    );
  }, [plan?.phases, activePhaseNumber]);

  // Activities for currently selected phase
  const activePhaseActivities = useMemo(() => {
    if (!activePhaseData?.activities) return [];
    return activePhaseData.activities.map((act) => ({
      ...act,
      completed: completedActivityIds.includes(act.id),
    }));
  }, [activePhaseData, completedActivityIds]);

  // Format body areas label cleanly from assessment / plan data
  const formattedBodyAreas = useMemo(() => {
    if (assessment?.body_areas && assessment.body_areas.length > 0) {
      return assessment.body_areas
        .map((areaId) => getAnatomyLabel(areaId) || ALL_BODY_REGIONS[areaId] || areaId)
        .join(", ");
    }
    if (plan?.targetAreas && plan.targetAreas.length > 0) {
      return plan.targetAreas
        .map((areaId) => getAnatomyLabel(areaId) || ALL_BODY_REGIONS[areaId] || areaId)
        .join(", ");
    }
    if (assessment?.activity) {
      return assessment.custom_activity || assessment.activity;
    }
    return "Not specified";
  }, [assessment, plan]);

  // ── 1. LOADING STATE ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="max-w-4xl mx-auto space-y-6 animate-pulse py-6">
          {/* Heading Skeleton */}
          <div className="space-y-2">
            <div className="h-4 w-36 bg-[#7C3AED]/20 rounded-full" />
            <div className="h-9 w-64 bg-[#7C3AED]/30 rounded-xl" />
            <div className="h-4 w-96 bg-[#7C3AED]/15 rounded" />
          </div>

          {/* Plan Overview Skeleton */}
          <div className="p-6 rounded-2xl bg-[#18132D] border border-[#7C3AED]/25 h-36" />

          {/* Current Phase Banner Skeleton */}
          <div className="p-6 rounded-2xl bg-[#18132D] border border-[#7C3AED]/25 h-44" />

          {/* Progress Card Skeleton */}
          <div className="p-6 rounded-2xl bg-[#18132D] border border-[#7C3AED]/25 h-28" />

          {/* Exercises Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="p-6 rounded-2xl bg-[#18132D] border border-[#7C3AED]/25 h-48" />
            <div className="p-6 rounded-2xl bg-[#18132D] border border-[#7C3AED]/25 h-48" />
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  // ── 2. ERROR STATE ──────────────────────────────────────────────────────────
  if (planError && !plan) {
    return (
      <AuthenticatedLayout>
        <div className="max-w-2xl mx-auto py-12 px-4 text-center space-y-6 animate-page-enter">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-[#FF6B6B]/15 border border-[#FF6B6B]/30 flex items-center justify-center shadow-xl">
            <AlertCircle className="w-8 h-8 text-[#FF6B6B]" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FF6B6B]/15 border border-[#FF6B6B]/30 text-xs font-bold uppercase tracking-wider text-[#FF6B6B]">
              <span>Request Error</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-[#FFFDF9] tracking-tight">
              Unable to Load Recovery Plan
            </h1>
            <p className="text-sm text-[#B8AEC8] max-w-md mx-auto leading-relaxed">
              {planError}
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <GradientButton
              type="button"
              onClick={fetchPlan}
              className="w-full sm:w-auto px-7 py-3 text-sm font-bold flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry Loading Plan</span>
            </GradientButton>

            <GradientButton
              type="button"
              variant="variant"
              onClick={() => navigate("/dashboard")}
              className="w-full sm:w-auto px-6 py-3 text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Dashboard</span>
            </GradientButton>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  // ── 3. NO RECOVERY PLAN AVAILABLE STATE ─────────────────────────────────────
  if (!plan && !assessment) {
    return (
      <AuthenticatedLayout>
        <div className="max-w-2xl mx-auto py-12 px-4 text-center space-y-6 animate-page-enter">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-[#18132D] border border-[#7C3AED]/30 flex items-center justify-center shadow-xl">
            <Activity className="w-10 h-10 text-[#F97368]" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#7C3AED]/15 border border-[#7C3AED]/30 text-xs font-bold uppercase tracking-wider text-[#FDBA8C]">
              <span>Plan Not Found</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-[#FFFDF9] tracking-tight">
              No Recovery Plan Available
            </h1>
            <p className="text-sm text-[#B8AEC8] max-w-md mx-auto leading-relaxed">
              Complete an assessment or try loading your existing plan again.
            </p>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <GradientButton
              type="button"
              onClick={() => navigate("/assessment")}
              className="w-full sm:w-auto px-7 py-3.5 text-sm font-bold flex items-center justify-center gap-2 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Start Assessment</span>
            </GradientButton>

            <GradientButton
              type="button"
              variant="variant"
              onClick={fetchPlan}
              className="w-full sm:w-auto px-6 py-3.5 text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry Loading</span>
            </GradientButton>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  // ── 4. RENDER REDESIGNED RECOVERY PLAN PAGE ─────────────────────────────────
  return (
    <AuthenticatedLayout>
      <div className="max-w-4xl mx-auto space-y-8 animate-page-enter pb-16">

        {/* ── SECTION 1 — PAGE HEADING ──────────────────────────────── */}
        <section className="space-y-2" aria-labelledby="page-heading">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#7C3AED]/20 border border-[#7C3AED]/40 text-xs font-bold uppercase tracking-wider text-[#FDBA8C]">
              <Sparkles className="w-3.5 h-3.5 text-[#F97368]" />
              <span>YOUR RECOVERY JOURNEY</span>
            </div>

            {/* Plan Status Badge (Only shown if data supports it) */}
            {plan?.status && (
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border flex items-center gap-1.5 ${
                  plan.status.toLowerCase() === "active" || plan.status.toLowerCase() === "ready"
                    ? "bg-[#10B981]/15 border-[#10B981]/35 text-[#10B981]"
                    : "bg-[#7C3AED]/15 border-[#7C3AED]/35 text-[#FDBA8C]"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-current" />
                <span>{plan.status}</span>
              </span>
            )}
          </div>

          <h1
            id="page-heading"
            className="text-3xl sm:text-4xl font-black font-display text-[#FFFDF9] tracking-tight"
          >
            Your Recovery Plan
          </h1>
          <p className="text-sm sm:text-base text-[#B8AEC8]">
            Track your recovery activities and monitor your progress.
          </p>
        </section>

        {/* ── SECTION 2 — PLAN OVERVIEW CARD (FULL WIDTH) ───────────── */}
        <section
          className="p-6 rounded-2xl bg-[#18132D] border border-[#7C3AED]/25 shadow-lg space-y-4"
          aria-labelledby="plan-overview-heading"
        >
          <div className="flex items-center justify-between pb-3 border-b border-[#7C3AED]/15">
            <div className="flex items-center gap-2.5">
              <Layers className="w-4 h-4 text-[#F97368]" />
              <h2
                id="plan-overview-heading"
                className="text-sm font-bold uppercase tracking-wider text-[#FDBA8C] font-display"
              >
                Plan Overview
              </h2>
            </div>
            {recordedAt && (
              <span className="text-xs text-[#B8AEC8] font-mono flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#7C3AED]" />
                <span>{recordedAt}</span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* Assessed body area or concern */}
            <div>
              <span className="text-[10px] font-bold uppercase text-[#B8AEC8] tracking-wider block">
                Assessed Body Area / Concern
              </span>
              <p className="text-sm font-bold text-[#FFFDF9] mt-0.5 truncate" title={formattedBodyAreas}>
                {formattedBodyAreas}
              </p>
            </div>

            {/* Current phase */}
            <div>
              <span className="text-[10px] font-bold uppercase text-[#B8AEC8] tracking-wider block">
                Current Phase
              </span>
              <p className="text-sm font-bold text-[#FFFDF9] mt-0.5">
                {plan?.currentPhaseNumber ? `Phase ${plan.currentPhaseNumber}` : "Phase 1"}
              </p>
            </div>

            {/* Plan status */}
            <div>
              <span className="text-[10px] font-bold uppercase text-[#B8AEC8] tracking-wider block">
                Plan Status
              </span>
              <p className="text-sm font-bold text-[#10B981] capitalize mt-0.5">
                {plan?.status || "Active"}
              </p>
            </div>

            {/* Total activities returned by backend */}
            <div>
              <span className="text-[10px] font-bold uppercase text-[#B8AEC8] tracking-wider block">
                Total Activities
              </span>
              <p className="text-sm font-bold text-[#FDBA8C] font-mono mt-0.5">
                {totalActivitiesCount} {totalActivitiesCount === 1 ? "Activity" : "Activities"}
              </p>
            </div>
          </div>
        </section>

        {/* ── SECTION 3 — CURRENT PHASE BANNER ──────────────────────── */}
        <section
          className="p-6 sm:p-7 rounded-2xl bg-gradient-to-br from-[#18132D] via-[#21183A] to-[#18132D] border-2 border-[#7C3AED]/35 shadow-xl space-y-4 relative overflow-hidden"
          aria-labelledby="current-phase-heading"
        >
          {/* Decorative background glow */}
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-[#7C3AED]/15 rounded-full blur-2xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#7C3AED]/25 border border-[#7C3AED]/40 text-xs font-bold font-mono uppercase tracking-widest text-[#FDBA8C]">
              <Compass className="w-3.5 h-3.5 text-[#F97368]" />
              <span>CURRENT PHASE</span>
            </div>

            {/* Phase duration / progress indicator if supplied */}
            {activePhaseData?.duration && (
              <div className="flex items-center gap-2 text-xs text-[#E9E2F5] font-mono">
                <Clock className="w-3.5 h-3.5 text-[#A78BFA]" />
                <span className="px-2.5 py-0.5 rounded-md bg-[#120D26]/70 border border-[#7C3AED]/25">
                  {activePhaseData.duration}
                </span>
              </div>
            )}
          </div>

          {activePhaseData ? (
            <div className="space-y-2">
              {/* Strongest text element: Phase Title */}
              <h2
                id="current-phase-heading"
                className="text-2xl sm:text-3xl font-black font-display text-[#FFFDF9] tracking-tight"
              >
                {activePhaseData.title || `Phase ${activePhaseData.phaseNumber}`}
                {activePhaseData.subtitle ? ` — ${activePhaseData.subtitle}` : ""}
              </h2>

              {/* Phase description */}
              <p className="text-sm sm:text-base text-[#B8AEC8] leading-relaxed max-w-2xl">
                {activePhaseData.summary || activePhaseData.name || "Follow the prescribed exercises and monitor movement comfort."}
              </p>
            </div>
          ) : (
            <div className="py-2 text-sm text-[#B8AEC8]">
              No current phase details available in the recovery plan.
            </div>
          )}

          {/* Phase Switching Tabs (If multiple phases exist) */}
          {plan?.phases && plan.phases.length > 1 && (
            <div className="pt-3 border-t border-[#7C3AED]/20 flex items-center gap-2 overflow-x-auto pb-1">
              {plan.phases.map((p) => {
                const isSelected = p.phaseNumber === activePhaseNumber;
                return (
                  <button
                    key={p.id || p.phaseNumber}
                    type="button"
                    onClick={() => setActivePhaseNumber(p.phaseNumber)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                      isSelected
                        ? "bg-[#F97368] text-[#120D26] shadow-md font-extrabold"
                        : "bg-[#120D26]/80 text-[#B8AEC8] hover:text-[#FFFDF9] border border-[#7C3AED]/25 hover:border-[#7C3AED]/50"
                    }`}
                  >
                    <span>{p.title || `Phase ${p.phaseNumber}`}</span>
                    {isSelected && <ChevronRight className="w-3 h-3" />}
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* ── SECTION 4 — ACTIVITY PROGRESS CARD ────────────────────── */}
        <section
          className="p-6 rounded-2xl bg-[#18132D] border border-[#7C3AED]/25 shadow-lg space-y-4"
          aria-labelledby="activity-progress-heading"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
              <h2
                id="activity-progress-heading"
                className="text-sm font-bold uppercase tracking-wider text-[#FDBA8C] font-display"
              >
                Activity Progress
              </h2>
            </div>
            <span className="text-xs font-mono font-bold text-[#FFFDF9]">
              {completedActivitiesCount} / {totalActivitiesCount} Completed
            </span>
          </div>

          {/* Horizontal Progress Bar */}
          <div className="space-y-2">
            <div className="w-full bg-[#21183A] rounded-full h-3.5 border border-[#7C3AED]/30 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#7C3AED] via-[#F97368] to-[#FDBA8C] rounded-full transition-all duration-500 ease-out"
                style={{ width: `${completionPercentage}%` }}
                role="progressbar"
                aria-valuenow={completionPercentage}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-[#B8AEC8]">
              <span>Overall Plan Completion</span>
              <span className="font-mono font-bold text-[#FDBA8C]">
                {completionPercentage}%
              </span>
            </div>
          </div>
        </section>

        {/* ── SECTION 5 — YOUR RECOMMENDED EXERCISES ─────────────────── */}
        <RecoveryActivitiesList
          activities={activePhaseActivities}
          onToggleComplete={handleToggleComplete}
          isLoading={loading}
          error={planError}
          onRetry={fetchPlan}
          title="Your Recommended Exercises"
          description="Review your available exercises, follow the supplied instructions, and track your activity completion."
        />

        {/* ── SECTION 6 — SAFETY INFORMATION CARD (FULL WIDTH) ──────── */}
        <section
          className="p-6 rounded-2xl bg-[#18132D] border border-[#7C3AED]/25 shadow-lg space-y-3"
          aria-labelledby="safety-info-heading"
        >
          <div className="flex items-center gap-2 pb-2 border-b border-[#7C3AED]/15">
            <ShieldCheck className="w-4 h-4 text-[#10B981]" />
            <h2
              id="safety-info-heading"
              className="text-sm font-bold uppercase tracking-wider text-[#FDBA8C] font-display"
            >
              Safety Information
            </h2>
          </div>

          {plan?.safetyGuidelines && plan.safetyGuidelines.length > 0 ? (
            <ul className="space-y-2 text-xs sm:text-sm text-[#E9E2F5]/90 pl-1 leading-relaxed">
              {plan.safetyGuidelines.map((guideline, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#F97368] shrink-0 mt-1.5" />
                  <span>{guideline}</span>
                </li>
              ))}
            </ul>
          ) : plan?.disclaimer ? (
            <p className="text-xs sm:text-sm text-[#B8AEC8] leading-relaxed">
              {plan.disclaimer}
            </p>
          ) : (
            <p className="text-xs text-[#B8AEC8] italic">
              No plan-specific safety notes are available.
            </p>
          )}
        </section>

        {/* ── SECTION 7 — BOTTOM NAVIGATION ACTIONS ─────────────────── */}
        <section
          className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#7C3AED]/20"
          aria-label="Recovery navigation actions"
        >
          <GradientButton
            type="button"
            onClick={() => navigate("/results")}
            className="w-full sm:w-auto px-7 py-3.5 text-sm font-bold flex items-center justify-center gap-2 cursor-pointer order-1 sm:order-1"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Assessment Results</span>
          </GradientButton>

          <GradientButton
            type="button"
            variant="variant"
            onClick={() => navigate("/dashboard")}
            className="w-full sm:w-auto px-6 py-3.5 text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer order-2 sm:order-2"
          >
            <span>Return to Dashboard</span>
          </GradientButton>
        </section>

      </div>
    </AuthenticatedLayout>
  );
};

export default RecoveryPlanPage;
