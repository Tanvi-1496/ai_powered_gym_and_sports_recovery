import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  HeartPulse,
  HelpCircle,
  Info,
  PlusCircle,
  RefreshCw,
  Shield,
  ShieldAlert,
  Sparkles,
  Stethoscope,
  Layers,
  FileQuestion,
} from "lucide-react";
import { AuthenticatedLayout } from "@/components/AuthenticatedLayout";
import { GradientButton } from "@/components/ui/gradient-button";
import {
  getActiveAssessment,
  getLatestAssessment,
  type AssessmentData,
} from "@/services/assessment";
import { getAnatomyLabel } from "@/data/anatomyManifest";
import { ALL_BODY_REGIONS } from "@/features/assessment/BodyMapStep";
import {
  getRecoveryCheckins,
  predictRecoveryScore,
  type RecoveryScoreResponse,
} from "@/services/recovery";
import type { BiomechanicalRiskPrediction, ClinicalTriageGuidance } from "@/types/prediction";

export const AssessmentResultsPage: React.FC = () => {
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState<AssessmentData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [recordedAt, setRecordedAt] = useState<string>("");

  // Recovery Readiness Prediction State (Live Extra Trees Model)
  const [latestPrediction, setLatestPrediction] = useState<RecoveryScoreResponse | null>(null);
  const [predictionLoading, setPredictionLoading] = useState<boolean>(false);
  const [predictionError, setPredictionError] = useState<string | null>(null);
  const [predictionTimestamp, setPredictionTimestamp] = useState<string>("");

  // Future ML Model State Contracts (Typed for future teammate integration)
  const [injuryRiskPrediction] = useState<BiomechanicalRiskPrediction | null>(null);
  const [clinicalGuidance] = useState<ClinicalTriageGuidance | null>(null);

  // How It Works Accordion
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState<boolean>(false);

  // Fetch telemetry check-ins and run live ML prediction
  const fetchTelemetryPrediction = useCallback(async () => {
    try {
      setPredictionLoading(true);
      setPredictionError(null);
      const checkins = await getRecoveryCheckins();

      if (checkins && checkins.length > 0) {
        const latest = checkins[0];
        if (latest.created_at) {
          setPredictionTimestamp(
            new Date(latest.created_at).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          );
        }

        if (latest.prediction) {
          setLatestPrediction(latest.prediction);
        } else {
          const pred = await predictRecoveryScore({
            sleep_hours: latest.sleep_hours,
            resting_heart_rate: latest.resting_heart_rate,
            hrv_ms: latest.hrv_ms,
            soreness: latest.soreness,
            energy_level: latest.energy_level,
          });
          setLatestPrediction(pred);
        }
      } else {
        setLatestPrediction(null);
      }
    } catch (err) {
      console.warn("[AssessmentResults] Could not load recovery telemetry:", err);
      setPredictionError("Recovery score unavailable");
    } finally {
      setPredictionLoading(false);
    }
  }, []);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      // 1. Try active session cache first
      let current = getActiveAssessment();

      // 2. Fallback to latest saved record in Supabase / localStorage
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
    fetchTelemetryPrediction();
  }, [recordedAt, fetchTelemetryPrediction]);

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
      case "repeated_activity": return "Overuse / repetitive motion";
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

  const formatMovementLimitation = (l?: string) => {
    switch (l) {
      case "yes": return "Yes, movement is limited";
      case "no": return "No limitation";
      case "mild": return "Mild restriction / uncertain";
      default: return l ? l.charAt(0).toUpperCase() + l.slice(1) : "None reported";
    }
  };

  const getTierBadgeStyle = (tier?: string) => {
    switch (tier?.toLowerCase()) {
      case "optimal":
        return "bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30";
      case "moderate":
        return "bg-[#F59E0B]/15 text-[#FDBA8C] border-[#F59E0B]/30";
      case "low":
        return "bg-[#F97368]/15 text-[#F97368] border-[#F97368]/30";
      case "critical":
        return "bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/30";
      default:
        return "bg-[#7C3AED]/15 text-[#E9E2F5] border-[#7C3AED]/30";
    }
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

  // ── Missing Assessment Fallback ─────────────────────────────────────────
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
              Please complete an assessment before viewing your results. Your inputs will be analyzed to generate your recovery plan and readiness profile.
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

            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="w-full sm:w-auto px-6 py-3.5 text-sm font-semibold text-[#B8AEC8] hover:text-[#FFFDF9] bg-[#18132D] hover:bg-[#21183A] border border-[#7C3AED]/25 rounded-2xl transition-colors cursor-pointer"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-5xl mx-auto space-y-8 animate-page-enter pb-16">

        {/* ── 1. Page Heading ────────────────────────────────────────────── */}
        <div className="space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#10B981]/15 border border-[#10B981]/35 text-xs font-bold uppercase tracking-wider text-[#10B981]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>ASSESSMENT COMPLETE</span>
            </div>

            {recordedAt && (
              <span className="text-xs text-[#B8AEC8] font-mono flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#18132D] border border-[#7C3AED]/20">
                <Clock className="w-3.5 h-3.5 text-[#7C3AED]" />
                <span>Recorded: {recordedAt}</span>
              </span>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl font-black font-display text-[#FFFDF9] tracking-tight">
            Your Assessment Results
          </h1>
          <p className="text-sm sm:text-base text-[#B8AEC8]">
            Review your assessment, recovery readiness, and next steps.
          </p>
        </div>

        {/* ── 2. Assessment Summary Card (Full-width) ───────────────────── */}
        <div className="p-6 sm:p-7 rounded-3xl bg-[#18132D] border border-[#7C3AED]/25 space-y-5 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-[#7C3AED]/15">
            <div className="flex items-center gap-2.5">
              <Activity className="w-5 h-5 text-[#F97368]" />
              <h2 className="text-lg font-bold font-display text-[#FFFDF9]">
                Your Assessment Summary
              </h2>
            </div>
            <span className="text-xs text-[#B8AEC8] font-mono">
              Submitted Profile
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* Body Area Selected */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#B8AEC8] block">
                Body Area Selected
              </span>
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {(assessment.body_areas || []).map((areaId) => (
                  <span
                    key={areaId}
                    className="px-3 py-1 rounded-lg bg-[#21183A] border border-[#7C3AED]/30 text-xs font-bold text-[#FFFDF9] flex items-center gap-1.5"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#F97368]" />
                    <span>{getAnatomyLabel(areaId) || ALL_BODY_REGIONS[areaId] || areaId}</span>
                  </span>
                ))}
                {(!assessment.body_areas || assessment.body_areas.length === 0) && (
                  <p className="text-sm font-semibold text-[#E9E2F5]">General Kinetic Chain</p>
                )}
              </div>
            </div>

            {/* Symptoms Reported */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#B8AEC8] block">
                Symptoms Reported
              </span>
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {(assessment.symptoms || []).map((sym) => (
                  <span
                    key={sym}
                    className="px-2.5 py-1 rounded-lg bg-[#21183A] border border-[#7C3AED]/20 text-xs font-medium text-[#E9E2F5] capitalize"
                  >
                    {sym.replace(/_/g, " ")}
                  </span>
                ))}
                {assessment.custom_symptom && (
                  <span className="px-2.5 py-1 rounded-lg bg-[#F97368]/15 border border-[#F97368]/30 text-xs font-semibold text-[#FDBA8C]">
                    &ldquo;{assessment.custom_symptom}&rdquo;
                  </span>
                )}
                {(!assessment.symptoms || assessment.symptoms.length === 0) && !assessment.custom_symptom && (
                  <p className="text-sm font-semibold text-[#E9E2F5]">None specified</p>
                )}
              </div>
            </div>

            {/* Activity & Context */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#B8AEC8] block">
                Sport / Activity & Context
              </span>
              <p className="text-sm font-bold text-[#FFFDF9]">
                {formatActivityName()}
                {assessment.activity_context && (
                  <span className="text-xs font-normal text-[#B8AEC8] block mt-0.5">
                    Noticed {formatContext(assessment.activity_context).toLowerCase()}
                  </span>
                )}
              </p>
            </div>

            {/* Onset & Duration */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#B8AEC8] block">
                Onset & Duration
              </span>
              <p className="text-sm font-bold text-[#FFFDF9]">
                {formatOnset(assessment.onset_type)}
                {assessment.duration && (
                  <span className="text-xs font-normal text-[#B8AEC8] block mt-0.5">
                    Duration: {formatDuration(assessment.duration)}
                  </span>
                )}
              </p>
            </div>

            {/* Pain / Severity Rating */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#B8AEC8] block">
                Pain / Severity Rating
              </span>
              <div className="flex items-center gap-3 pt-0.5">
                <span className="text-xl font-black font-mono text-[#F97368]">
                  {assessment.pain_severity !== undefined ? `${assessment.pain_severity} / 10` : "Not rated"}
                </span>
                {assessment.pain_severity !== undefined && (
                  <div className="flex-1 max-w-[160px] h-2 bg-[#21183A] rounded-full overflow-hidden border border-[#7C3AED]/20">
                    <div
                      className="h-full bg-gradient-to-r from-[#10B981] via-[#FDBA8C] to-[#F97368] rounded-full"
                      style={{ width: `${(assessment.pain_severity / 10) * 100}%` }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Relevant Movement Limitations */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#B8AEC8] block">
                Movement Limitation
              </span>
              <p className="text-sm font-bold text-[#FFFDF9]">
                {formatMovementLimitation(assessment.movement_limitation)}
              </p>
            </div>

            {/* Additional Notes (If collected) */}
            {assessment.additional_details && (
              <div className="md:col-span-2 pt-2 border-t border-[#7C3AED]/15 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#B8AEC8] block">
                  Athlete Subjective Notes
                </span>
                <p className="text-xs sm:text-sm text-[#E9E2F5] bg-[#120D26]/70 p-3 rounded-xl border border-[#7C3AED]/20 italic">
                  &ldquo;{assessment.additional_details}&rdquo;
                </p>
              </div>
            )}

          </div>
        </div>

        {/* ── Desktop Two-Column Responsive Grid ─────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ── Left Column: 3. Recovery Readiness Score Card ───────────── */}
          <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-[#18132D] via-[#21183A] to-[#18132D] border border-[#7C3AED]/35 shadow-xl space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#7C3AED]/15">
                <div className="flex items-center gap-2">
                  <HeartPulse className="w-5 h-5 text-[#F97368]" />
                  <h2 className="text-lg font-bold font-display text-[#FFFDF9]">
                    Recovery Readiness
                  </h2>
                </div>

                {latestPrediction ? (
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${getTierBadgeStyle(
                      latestPrediction.tier
                    )}`}
                  >
                    {latestPrediction.score_tier || `${latestPrediction.tier} Tier`}
                  </span>
                ) : predictionLoading ? (
                  <span className="text-xs text-[#B8AEC8]">Calculating...</span>
                ) : null}
              </div>

              {/* State handling: Loading Skeleton vs Error vs Score Display */}
              {predictionLoading ? (
                <div className="space-y-4 py-6 animate-pulse">
                  <div className="h-14 w-36 bg-[#21183A] rounded-2xl mx-auto" />
                  <div className="h-3 w-48 bg-[#21183A] rounded-md mx-auto" />
                  <div className="h-2 w-full bg-[#21183A] rounded-full" />
                </div>
              ) : predictionError ? (
                <div className="p-4 rounded-2xl bg-[#FF6B6B]/15 border border-[#FF6B6B]/30 space-y-3 text-center sm:text-left">
                  <div className="flex items-center gap-2 text-[#FF6B6B]">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span className="text-xs font-bold text-[#FFFDF9]">Recovery score unavailable</span>
                  </div>
                  <p className="text-xs text-[#E9E2F5]/80">
                    Unable to compute telemetry prediction. Check your network or submit a check-in.
                  </p>
                  <button
                    type="button"
                    onClick={fetchTelemetryPrediction}
                    className="px-3 py-1.5 rounded-xl bg-[#21183A] text-xs font-bold text-[#FFFDF9] border border-[#7C3AED]/30 hover:border-[#F97368] flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Retry Prediction</span>
                  </button>
                </div>
              ) : latestPrediction ? (
                <div className="space-y-4">
                  {/* Big Numeric Score Display */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-[#120D26]/80 border border-[#7C3AED]/25">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#B8AEC8] block">
                        Calculated Readiness
                      </span>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-4xl sm:text-5xl font-black font-display text-gradient-coral-peach">
                          {latestPrediction.score}
                        </span>
                        <span className="text-sm font-bold text-[#B8AEC8] font-mono">/100</span>
                      </div>
                    </div>

                    {predictionTimestamp && (
                      <span className="text-[11px] text-[#B8AEC8] font-mono flex items-center gap-1 self-start sm:self-center">
                        <Clock className="w-3 h-3 text-[#A78BFA]" />
                        <span>{predictionTimestamp}</span>
                      </span>
                    )}
                  </div>

                  {/* Horizontal Visual Score Indicator */}
                  <div className="space-y-1">
                    <div className="h-2.5 w-full bg-[#18132D] rounded-full overflow-hidden border border-[#7C3AED]/20">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ease-out ${
                          latestPrediction.score >= 75
                            ? "bg-gradient-to-r from-[#10B981] to-[#34D399]"
                            : latestPrediction.score >= 50
                            ? "bg-gradient-to-r from-[#F59E0B] to-[#FDBA8C]"
                            : "bg-gradient-to-r from-[#EF4444] to-[#F97368]"
                        }`}
                        style={{ width: `${Math.min(100, Math.max(0, latestPrediction.score))}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-[#B8AEC8] font-mono">
                      <span>0 (Fatigued)</span>
                      <span>50 (Moderate)</span>
                      <span>100 (Optimal)</span>
                    </div>
                  </div>

                  <p className="text-xs text-[#B8AEC8] leading-relaxed">
                    A model-estimated recovery/readiness score based on available athlete data.
                  </p>

                  {/* Contributing Factors if present */}
                  {latestPrediction.contributing_factors && latestPrediction.contributing_factors.length > 0 && (
                    <div className="pt-2 border-t border-[#7C3AED]/15 space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#B8AEC8] block">
                        Observed Physiological Drivers
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {latestPrediction.contributing_factors.map((factor, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 rounded-lg bg-[#18132D] border border-[#7C3AED]/20 text-[11px] text-[#E9E2F5] flex items-center gap-1.5"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-[#F97368]" />
                            <span>{factor}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* No telemetry logged yet */
                <div className="p-4 rounded-2xl bg-[#120D26]/60 border border-[#7C3AED]/20 text-center space-y-2 py-5">
                  <Sparkles className="w-6 h-6 text-[#FDBA8C] mx-auto opacity-70" />
                  <p className="text-xs font-semibold text-[#FFFDF9]">
                    Daily check-in telemetry pending
                  </p>
                  <p className="text-[11px] text-[#B8AEC8] max-w-xs mx-auto">
                    A model-estimated recovery/readiness score based on available athlete data. Log your daily sleep & soreness metrics to generate your score.
                  </p>
                </div>
              )}
            </div>

            {/* Expandable "How this score works" Section */}
            <div className="pt-3 border-t border-[#7C3AED]/15">
              <button
                type="button"
                onClick={() => setIsHowItWorksOpen(!isHowItWorksOpen)}
                className="w-full flex items-center justify-between text-xs font-bold text-[#FDBA8C] hover:text-[#FFFDF9] transition-colors cursor-pointer py-1"
              >
                <span className="flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-[#F97368]" />
                  <span>How this score works</span>
                </span>
                {isHowItWorksOpen ? (
                  <ChevronUp className="w-4 h-4 text-[#B8AEC8]" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-[#B8AEC8]" />
                )}
              </button>

              {isHowItWorksOpen && (
                <div className="mt-2 p-3.5 rounded-xl bg-[#120D26]/80 border border-[#7C3AED]/20 text-[11px] text-[#B8AEC8] leading-relaxed space-y-1.5 animate-in fade-in duration-200">
                  <p>
                    This score estimates your autonomic recovery and physiological training readiness based on available telemetry (such as sleep duration, resting heart rate, HRV, and perceived muscle soreness).
                  </p>
                  <p className="text-[#FDBA8C] font-semibold">
                    Important: This score is a wellness recovery readiness estimate and is not an injury probability or certified clinical diagnosis.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ── Right Column: Stacked Cards (Injury Risk + Clinical Guidance) ── */}
          <div className="space-y-6 flex flex-col justify-between">

            {/* ── 4. Injury Risk Prediction Card ─────────────────────────── */}
            <div className="p-6 sm:p-7 rounded-3xl bg-[#18132D] border border-[#7C3AED]/25 shadow-xl space-y-4">
              {/* Region 1: Header & Status Badge */}
              <div className="flex items-center justify-between pb-2 border-b border-[#7C3AED]/15">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-[#FDBA8C]" />
                  <h2 className="text-lg font-bold font-display text-[#FFFDF9]">
                    Injury Risk Prediction
                  </h2>
                </div>

                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#7C3AED]/20 border border-[#7C3AED]/35 text-[10px] font-bold uppercase tracking-wider text-[#FDBA8C]">
                  <span>{injuryRiskPrediction?.status === "completed" ? "Model Integrated" : "Awaiting model integration"}</span>
                </span>
              </div>

              {/* Region 2: Description */}
              <p className="text-xs text-[#B8AEC8] leading-relaxed">
                This module will estimate injury risk using the dedicated injury-risk model.
              </p>

              {/* Region 3: Prediction Region (Reserved / Ready for Model Output) */}
              {injuryRiskPrediction?.status === "completed" && injuryRiskPrediction.riskScore !== null ? (
                <div className="p-4 rounded-2xl bg-[#120D26]/90 border border-[#7C3AED]/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#E9E2F5]">Risk Level:</span>
                    <span className="text-xs font-bold text-[#FDBA8C] uppercase">{injuryRiskPrediction.riskLevel}</span>
                  </div>
                  <p className="text-xs text-[#FFFDF9]">Target: {injuryRiskPrediction.predictedRiskArea}</p>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-[#120D26]/70 border border-[#7C3AED]/20 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#FDBA8C]">
                    <Layers className="w-3.5 h-3.5" />
                    <span>Prediction Output Pipeline</span>
                  </div>
                  <p className="text-xs text-[#B8AEC8]/80 leading-relaxed">
                    Calibrated risk probabilities and anatomical strain likelihood will populate here once the dedicated injury-risk inference service is connected.
                  </p>
                </div>
              )}

              {/* Region 4: Contributing Factors Region */}
              {injuryRiskPrediction?.contributingFactors && injuryRiskPrediction.contributingFactors.length > 0 ? (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#B8AEC8] block">
                    Contributing Factors
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {injuryRiskPrediction.contributingFactors.map((factor) => (
                      <span key={factor.id} className="px-2.5 py-1 rounded-lg bg-[#21183A] text-[11px] text-[#E9E2F5]">
                        {factor.name}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-[#120D26]/40 border border-[#7C3AED]/15 text-[11px] text-[#B8AEC8] flex items-center gap-2">
                  <Info className="w-3.5 h-3.5 text-[#A78BFA] shrink-0" />
                  <span>Contributing biomechanical factors will populate only when provided by the model.</span>
                </div>
              )}

              {/* Region 5: Explanation Region */}
              {injuryRiskPrediction?.explanation ? (
                <p className="text-xs text-[#E9E2F5]/90 leading-relaxed p-3 rounded-xl bg-[#120D26]/60 border border-[#7C3AED]/20">
                  {injuryRiskPrediction.explanation}
                </p>
              ) : (
                <div className="p-3 rounded-xl bg-[#120D26]/30 border border-[#7C3AED]/10 text-[11px] text-[#B8AEC8]/70 flex items-center gap-2">
                  <FileQuestion className="w-3.5 h-3.5 text-[#7C3AED] shrink-0" />
                  <span>Model rationale and biomechanical context will be shown here.</span>
                </div>
              )}

              {/* Region 6: Footer */}
              <div className="pt-2 border-t border-[#7C3AED]/15 text-[10px] text-[#B8AEC8]/70 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#7C3AED]" />
                <span>Module is reserved and will be activated upon teammate backend model integration.</span>
              </div>
            </div>

            {/* ── 5. Clinical Guidance Card ──────────────────────────────── */}
            <div className="p-6 sm:p-7 rounded-3xl bg-[#18132D] border border-[#7C3AED]/25 shadow-xl space-y-4">
              {/* Region 1: Header & Status Badge */}
              <div className="flex items-center justify-between pb-2 border-b border-[#7C3AED]/15">
                <div className="flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-[#10B981]" />
                  <h2 className="text-lg font-bold font-display text-[#FFFDF9]">
                    Clinical Guidance
                  </h2>
                </div>

                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#7C3AED]/20 border border-[#7C3AED]/35 text-[10px] font-bold uppercase tracking-wider text-[#A78BFA]">
                  <span>{clinicalGuidance?.status === "available" ? "Guidance Active" : "Guidance integration pending"}</span>
                </span>
              </div>

              {/* Region 2: Short Description */}
              <p className="text-xs text-[#B8AEC8] leading-relaxed">
                This section will provide consultation guidance from the dedicated clinical rules module.
              </p>

              {/* Region 3: Reserved Guidance Output Area */}
              {clinicalGuidance?.status === "available" && clinicalGuidance.primaryRecommendation ? (
                <div className="p-4 rounded-2xl bg-[#120D26]/90 border border-[#7C3AED]/30 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#10B981] block">
                    Clinical Recommendation
                  </span>
                  <p className="text-xs text-[#FFFDF9] leading-relaxed">{clinicalGuidance.primaryRecommendation}</p>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-[#120D26]/70 border border-[#7C3AED]/20 space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#B8AEC8] block">
                    Triage & Advisory Protocol
                  </span>
                  <p className="text-xs text-[#B8AEC8]/80 leading-relaxed">
                    Sports medicine clinical triage, specialist consultation recommendations, and red-flag screening will be displayed once the clinical rules module is connected.
                  </p>
                </div>
              )}

              {/* Region 4: Reserved Urgency / Status Area (Only if future service returns it) */}
              {clinicalGuidance?.urgency && (
                <div className="p-3 rounded-xl bg-[#21183A] border border-[#7C3AED]/30 text-xs text-[#FFFDF9] flex items-center justify-between">
                  <span className="text-[#B8AEC8]">Urgency Level:</span>
                  <span className="font-bold uppercase text-[#FDBA8C]">{clinicalGuidance.urgency.replace(/_/g, " ")}</span>
                </div>
              )}

              {/* Region 5: Reserved Explanation Area */}
              {clinicalGuidance?.explanation ? (
                <p className="text-xs text-[#E9E2F5]/90 leading-relaxed p-3 rounded-xl bg-[#120D26]/60 border border-[#7C3AED]/20">
                  {clinicalGuidance.explanation}
                </p>
              ) : (
                <div className="p-3 rounded-xl bg-[#F97368]/10 border border-[#F97368]/25 text-[11px] text-[#FDBA8C] leading-relaxed flex items-start gap-2">
                  <Shield className="w-3.5 h-3.5 text-[#F97368] shrink-0 mt-0.5" />
                  <span>
                    Always consult a licensed medical professional for acute physical trauma or severe joint instability.
                  </span>
                </div>
              )}

              {/* Region 6: Footer */}
              <div className="pt-2 border-t border-[#7C3AED]/15 text-[10px] text-[#B8AEC8]/70 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#7C3AED]" />
                <span>Guidance module is unavailable until clinical rule integration is complete.</span>
              </div>
            </div>

          </div>

        </div>

        {/* ── 6. Bottom Action Area ──────────────────────────────────────── */}
        <div className="pt-4 border-t border-[#7C3AED]/20 flex flex-col sm:flex-row items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-transparent hover:bg-[#18132D] text-xs sm:text-sm font-semibold text-[#B8AEC8] hover:text-[#FFFDF9] border border-transparent hover:border-[#7C3AED]/30 transition-all cursor-pointer text-center"
          >
            Back to Dashboard
          </button>

          <GradientButton
            type="button"
            onClick={() => navigate("/recovery-plan")}
            className="w-full sm:w-auto min-w-[220px] px-8 py-4 rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 cursor-pointer shadow-xl shadow-[#7C3AED]/20 group"
          >
            <span>View Recovery Plan</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
          </GradientButton>
        </div>

      </div>
    </AuthenticatedLayout>
  );
};

export default AssessmentResultsPage;
