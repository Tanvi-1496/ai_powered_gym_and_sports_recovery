import React from "react";
import {
  Activity,
  CheckCircle2,
  Clock,
  HeartPulse,
  Layers,
  Sparkles,
  Target,
  Workflow,
  AlertCircle,
  RefreshCw,
  Info,
} from "lucide-react";
import type { AssessmentData } from "@/services/assessment";
import type { RecoveryCheckin, RecoveryScoreResponse } from "@/services/recovery";
import { getAnatomyLabel } from "@/data/anatomyManifest";
import { ALL_BODY_REGIONS } from "@/features/assessment/BodyMapStep";

interface RecoveryOverviewCardProps {
  assessment: AssessmentData | null;
  prediction?: RecoveryScoreResponse | null;
  latestCheckin?: RecoveryCheckin | null;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export const RecoveryOverviewCard: React.FC<RecoveryOverviewCardProps> = ({
  assessment,
  prediction,
  latestCheckin,
  loading = false,
  error = null,
  onRetry,
}) => {
  const formatActivity = () => {
    if (!assessment) return "Active Recovery";
    if (assessment.activity === "other" && assessment.custom_activity) {
      return assessment.custom_activity;
    }
    return assessment.activity
      ? assessment.activity.charAt(0).toUpperCase() + assessment.activity.slice(1)
      : "Active Recovery";
  };

  const primaryTargetLabel = () => {
    if (!assessment || !assessment.body_areas || assessment.body_areas.length === 0) {
      return "General Kinetic Chain";
    }
    const first = assessment.body_areas[0];
    const label = getAnatomyLabel(first) || ALL_BODY_REGIONS[first] || first;
    if (assessment.body_areas.length > 1) {
      return `${label} +${assessment.body_areas.length - 1} more`;
    }
    return label;
  };

  const formattedCheckinTime = latestCheckin?.created_at
    ? new Date(latestCheckin.created_at).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#18132D] via-[#21183A] to-[#18132D] border border-[#7C3AED]/35 shadow-2xl relative overflow-hidden space-y-6">
      {/* Ambient Glows */}
      <div
        className="absolute -top-24 -left-24 w-64 h-64 bg-[#7C3AED]/20 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-24 -right-24 w-64 h-64 bg-[#F97368]/15 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      {/* Header section */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#7C3AED]/20 border border-[#7C3AED]/40 flex items-center justify-center">
            <Workflow className="w-5 h-5 text-[#FDBA8C]" />
          </div>
          <div>
            <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-[#FDBA8C]">
              Adaptive Telemetry & Recovery Analysis
            </span>
            <h2 className="text-xl sm:text-2xl font-bold font-display text-[#FFFDF9]">
              Recovery Overview
            </h2>
          </div>
        </div>

        {/* Engine Live Status Badge */}
        {prediction ? (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#10B981]/15 border border-[#10B981]/35 text-xs font-bold uppercase tracking-wider text-[#10B981] self-start sm:self-auto">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Extra Trees ML Model • Active</span>
          </div>
        ) : loading ? (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#7C3AED]/15 border border-[#7C3AED]/35 text-xs font-bold uppercase tracking-wider text-[#FDBA8C] self-start sm:self-auto">
            <div className="w-3 h-3 rounded-full border-2 border-[#F97368] border-t-transparent animate-spin" />
            <span>Evaluating Readiness...</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#7C3AED]/15 border border-[#7C3AED]/35 text-xs font-bold uppercase tracking-wider text-[#FDBA8C] self-start sm:self-auto">
            <HeartPulse className="w-3.5 h-3.5 text-[#F97368]" />
            <span>Check-in Telemetry Required</span>
          </div>
        )}
      </div>

      {/* Main Recovery Analysis Card */}
      <div className="relative z-10">
        {loading ? (
          /* Loading State Skeleton */
          <div className="p-6 rounded-2xl bg-[#120D26]/80 border border-[#7C3AED]/25 space-y-4 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="h-5 w-48 bg-[#21183A] rounded-lg" />
              <div className="h-8 w-24 bg-[#21183A] rounded-xl" />
            </div>
            <div className="h-3 w-3/4 bg-[#21183A] rounded-md" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="h-12 bg-[#21183A] rounded-xl" />
              <div className="h-12 bg-[#21183A] rounded-xl" />
              <div className="h-12 bg-[#21183A] rounded-xl" />
              <div className="h-12 bg-[#21183A] rounded-xl" />
            </div>
          </div>
        ) : error ? (
          /* Error State */
          <div className="p-5 rounded-2xl bg-[#FF6B6B]/15 border border-[#FF6B6B]/35 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5 text-[#FF6B6B]">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-[#FFFDF9]">Telemetry Analysis Unavailable</p>
                <p className="text-xs text-[#E9E2F5]/80 mt-0.5">{error}</p>
              </div>
            </div>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="px-3.5 py-1.5 rounded-xl bg-[#21183A] text-xs font-bold text-[#FFFDF9] border border-[#7C3AED]/30 hover:border-[#F97368] flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            )}
          </div>
        ) : prediction && latestCheckin ? (
          /* Live ML Prediction Analysis */
          <div className="p-5 sm:p-6 rounded-2xl bg-[#120D26]/85 border border-[#7C3AED]/30 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#FDBA8C] font-display flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#F97368]" />
                    <span>ML Readiness Analysis</span>
                  </span>

                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                      prediction.tier === "optimal"
                        ? "bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30"
                        : prediction.tier === "moderate"
                        ? "bg-[#F59E0B]/15 text-[#FDBA8C] border-[#F59E0B]/30"
                        : "bg-[#F97368]/15 text-[#F97368] border-[#F97368]/30"
                    }`}
                  >
                    {prediction.score_tier || `${prediction.tier} Readiness`}
                  </span>

                  {formattedCheckinTime && (
                    <span className="text-[11px] text-[#B8AEC8] font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#A78BFA]" />
                      <span>{formattedCheckinTime}</span>
                    </span>
                  )}
                </div>

                <h3 className="text-lg sm:text-xl font-black text-[#FFFDF9] font-display tracking-tight mt-1">
                  {prediction.headline}
                </h3>
                <p className="text-xs sm:text-sm text-[#E9E2F5]/90 leading-relaxed max-w-2xl">
                  {prediction.summary}
                </p>
              </div>

              {/* Recovery Score Dial Box */}
              <div className="flex items-center sm:flex-col items-end justify-between shrink-0 bg-[#18132D] p-3.5 sm:px-5 sm:py-3 rounded-2xl border border-[#7C3AED]/30 shadow-md">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#B8AEC8]">
                  Recovery Score
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl sm:text-4xl font-black font-display text-gradient-coral-peach">
                    {prediction.score}
                  </span>
                  <span className="text-xs text-[#B8AEC8] font-mono">/ 100</span>
                </div>
              </div>
            </div>

            {/* Score Progress Bar */}
            <div className="space-y-1">
              <div className="w-full bg-[#18132D] h-2.5 rounded-full overflow-hidden border border-[#7C3AED]/20">
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out ${
                    prediction.score >= 75
                      ? "bg-gradient-to-r from-[#10B981] to-[#34D399]"
                      : prediction.score >= 50
                      ? "bg-gradient-to-r from-[#F59E0B] to-[#FDBA8C]"
                      : "bg-gradient-to-r from-[#EF4444] to-[#F97368]"
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0, prediction.score))}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-[#B8AEC8] font-mono">
                <span>0 (High Fatigue)</span>
                <span>50 (Moderate)</span>
                <span>100 (Optimal Capacity)</span>
              </div>
            </div>

            {/* Contributing Physiological Drivers */}
            {prediction.contributing_factors && prediction.contributing_factors.length > 0 && (
              <div className="space-y-2 pt-1 border-t border-[#7C3AED]/15">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#B8AEC8] block">
                  Model Physiological Drivers
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {prediction.contributing_factors.map((factor, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-2 rounded-xl bg-[#18132D]/80 border border-[#7C3AED]/20 text-xs text-[#E9E2F5]"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#F97368] shrink-0" />
                      <span className="truncate">{factor}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Feature Transparency Metrics */}
            <div className="flex flex-wrap items-center gap-2.5 text-[11px] text-[#B8AEC8] pt-1">
              <span className="px-2.5 py-1 rounded-lg bg-[#18132D] border border-[#7C3AED]/20">
                <strong className="text-[#FFFDF9]">{prediction.observed_features_count}</strong> active observed & derived metrics
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-[#18132D] border border-[#7C3AED]/20">
                <strong className="text-[#FFFDF9]">{prediction.imputed_features_count}</strong> model baseline priors
              </span>
            </div>

            {/* Mandatory Experimental Wellness Disclaimer */}
            <div className="p-3 rounded-xl bg-[#18132D]/90 border border-[#FDBA8C]/25 text-[11px] text-[#B8AEC8] leading-relaxed flex items-start gap-2">
              <Info className="w-4 h-4 text-[#FDBA8C] shrink-0 mt-0.5" />
              <div>
                <strong className="text-[#FDBA8C]">Experimental Wellness Estimate: </strong>
                <span>{prediction.disclaimer}</span>
              </div>
            </div>
          </div>
        ) : (
          /* Empty State (No Check-in yet) */
          <div className="p-6 rounded-2xl bg-[#120D26]/75 border border-[#7C3AED]/25 space-y-3 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#7C3AED]/20 text-[10px] font-bold text-[#FDBA8C] uppercase tracking-wider">
                <Sparkles className="w-3 h-3 text-[#F97368]" />
                <span>Daily Telemetry Sync</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-[#FFFDF9]">
                Log your daily recovery check-in to generate your ML score.
              </h3>
              <p className="text-xs text-[#B8AEC8] leading-relaxed">
                Record today&apos;s sleep hours, resting heart rate, and soreness below. The Extra Trees ML model will analyze your physiological telemetry to compute readiness and load tolerance.
              </p>
            </div>

            <a
              href="#daily-recovery-checkin"
              className="px-4 py-2.5 rounded-xl bg-[#21183A] hover:bg-[#7C3AED]/30 text-xs font-bold text-[#FDBA8C] hover:text-[#FFFDF9] border border-[#7C3AED]/40 transition-all shrink-0 cursor-pointer shadow-md flex items-center gap-1.5"
            >
              <HeartPulse className="w-3.5 h-3.5 text-[#F97368]" />
              <span>Log Today&apos;s Check-in</span>
            </a>
          </div>
        )}
      </div>

      {/* Telemetry Context Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 relative z-10">
        <div className="p-3.5 rounded-2xl bg-[#18132D]/90 border border-[#7C3AED]/20 space-y-1">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-[#B8AEC8] tracking-wider">
            <Activity className="w-3.5 h-3.5 text-[#F97368]" />
            <span>Target Sport</span>
          </div>
          <p className="text-sm font-bold text-[#FFFDF9] truncate">{formatActivity()}</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#18132D]/90 border border-[#7C3AED]/20 space-y-1">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-[#B8AEC8] tracking-wider">
            <Target className="w-3.5 h-3.5 text-[#FDBA8C]" />
            <span>Target Focus</span>
          </div>
          <p className="text-sm font-bold text-[#FFFDF9] truncate">{primaryTargetLabel()}</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#18132D]/90 border border-[#7C3AED]/20 space-y-1">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-[#B8AEC8] tracking-wider">
            <Layers className="w-3.5 h-3.5 text-[#A78BFA]" />
            <span>Phase Status</span>
          </div>
          <p className="text-sm font-bold text-[#FFFDF9] truncate">4 Phases (Active)</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#18132D]/90 border border-[#7C3AED]/20 space-y-1">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-[#B8AEC8] tracking-wider">
            <HeartPulse className="w-3.5 h-3.5 text-[#10B981]" />
            <span>Telemetry Readiness</span>
          </div>
          <p className="text-sm font-bold text-[#FFFDF9] truncate">
            {prediction ? `${prediction.score}/100 (${prediction.tier})` : "Awaiting Check-in"}
          </p>
        </div>
      </div>
    </div>
  );
};
