import React from "react";
import {
  CheckCircle2,
  Circle,
  Clock,
  Repeat,
  Calendar,
  ShieldAlert,
  ListOrdered,
  RefreshCw,
  Dumbbell,
  PlayCircle,
} from "lucide-react";
import type { RecoveryActivity } from "@/types/recovery";

export interface RecoveryActivitiesListProps {
  activities?: RecoveryActivity[];
  onToggleComplete?: (activityId: string) => void;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  title?: string;
  description?: string;
}

export const RecoveryActivitiesList: React.FC<RecoveryActivitiesListProps> = ({
  activities = [],
  onToggleComplete,
  isLoading = false,
  error = null,
  onRetry,
  title = "Your Recommended Exercises",
  description = "Review your available exercises, follow the supplied instructions, and track your activity completion.",
}) => {
  const hasActivities = activities && activities.length > 0;

  return (
    <section className="space-y-4" aria-labelledby="exercises-heading">
      {/* ── Section Heading & Description ───────────────────────────── */}
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-2">
          <h2
            id="exercises-heading"
            className="text-xl sm:text-2xl font-bold font-display text-[#FFFDF9] tracking-tight flex items-center gap-2"
          >
            <Dumbbell className="w-5 h-5 text-[#F97368]" />
            <span>{title}</span>
          </h2>
          {hasActivities && (
            <span className="px-2.5 py-1 rounded-full bg-[#7C3AED]/20 border border-[#7C3AED]/30 text-xs font-mono text-[#FDBA8C]">
              {activities.length} {activities.length === 1 ? "Exercise" : "Exercises"}
            </span>
          )}
        </div>
        <p className="text-xs sm:text-sm text-[#B8AEC8] leading-relaxed">
          {description}
        </p>
      </div>

      {/* ── Loading Skeleton ────────────────────────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="p-6 rounded-2xl bg-[#18132D] border border-[#7C3AED]/25 space-y-4 animate-pulse"
            >
              <div className="flex items-center justify-between">
                <div className="h-5 bg-[#7C3AED]/30 rounded w-1/2" />
                <div className="h-7 w-24 bg-[#7C3AED]/20 rounded-xl" />
              </div>
              <div className="h-4 bg-[#7C3AED]/20 rounded w-3/4" />
              <div className="h-16 bg-[#21183A] rounded-xl" />
            </div>
          ))}
        </div>
      ) : error ? (
        /* ── Error State ──────────────────────────────────────────── */
        <div className="p-6 rounded-2xl bg-[#FF6B6B]/15 border border-[#FF6B6B]/35 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3 text-[#FF6B6B]">
            <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-[#FFFDF9]">Unable to load exercises</p>
              <p className="text-xs text-[#E9E2F5]/80 mt-0.5">{error}</p>
            </div>
          </div>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="px-4 py-2 rounded-xl bg-[#21183A] text-xs font-bold text-[#FFFDF9] border border-[#7C3AED]/40 hover:border-[#F97368] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          )}
        </div>
      ) : hasActivities ? (
        /* ── Two-Column Responsive Exercise Cards Grid ─────────────── */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {activities.map((act) => {
            const isCompleted = Boolean(act.completed);

            // Normalize structured instructions if present
            const structuredInstructions: string[] = Array.isArray(act.instructions)
              ? act.instructions
              : typeof act.instructions === "string" && act.instructions.trim().length > 0
              ? act.instructions.split("\n").filter((step) => step.trim().length > 0)
              : [];

            return (
              <div
                key={act.id}
                className={`p-6 rounded-2xl border transition-all duration-300 flex flex-col justify-between space-y-4 relative overflow-hidden group ${
                  isCompleted
                    ? "bg-[#18132D]/60 border-[#10B981]/40 shadow-sm"
                    : "bg-[#18132D] border-[#7C3AED]/25 hover:border-[#7C3AED]/50 hover:-translate-y-0.5 shadow-lg"
                }`}
              >
                <div className="space-y-3">
                  {/* Card Header: Target Area Badge & Title & Completion Action */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      {act.targetArea && (
                        <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-[#FDBA8C] px-2.5 py-0.5 rounded-md bg-[#7C3AED]/15 border border-[#7C3AED]/25 inline-block">
                          {act.targetArea}
                        </span>
                      )}
                      <h3 className="text-base sm:text-lg font-bold text-[#FFFDF9] leading-snug">
                        {act.name}
                      </h3>
                    </div>

                    <button
                      type="button"
                      onClick={() => onToggleComplete && onToggleComplete(act.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                        isCompleted
                          ? "bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40 hover:bg-[#10B981]/30"
                          : "bg-[#21183A] text-[#B8AEC8] hover:text-[#FFFDF9] border border-[#7C3AED]/30 hover:border-[#F97368]/50"
                      }`}
                      aria-label={isCompleted ? `Mark ${act.name} as incomplete` : `Mark ${act.name} as completed`}
                    >
                      {isCompleted ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                          <span>Completed</span>
                        </>
                      ) : (
                        <>
                          <Circle className="w-4 h-4" />
                          <span>Mark Complete</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Demonstration Media (Only if real asset exists) */}
                  {(act.mediaUrl || act.videoThumbnailUrl) && (
                    <div className="relative rounded-xl overflow-hidden bg-[#120D26] border border-[#7C3AED]/20 max-h-48 flex items-center justify-center">
                      <img
                        src={act.mediaUrl || act.videoThumbnailUrl}
                        alt={act.name}
                        className="w-full h-40 object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                        <PlayCircle className="w-8 h-8 text-[#FFFDF9]/80" />
                      </div>
                    </div>
                  )}

                  {/* Description (If supplied) */}
                  {act.description && (
                    <p className="text-xs sm:text-sm text-[#B8AEC8] leading-relaxed">
                      {act.description}
                    </p>
                  )}

                  {/* Numbered Instructions (If structured instructions exist) */}
                  {structuredInstructions.length > 0 && (
                    <div className="p-3.5 rounded-xl bg-[#120D26]/70 border border-[#7C3AED]/20 space-y-2">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#FDBA8C]">
                        <ListOrdered className="w-3.5 h-3.5" />
                        <span>Step-by-Step Instructions</span>
                      </div>
                      <ol className="space-y-1.5 pl-4 text-xs text-[#E9E2F5]/90 list-decimal leading-relaxed">
                        {structuredInstructions.map((step, idx) => (
                          <li key={idx}>{step}</li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {/* Exercise Prescription Badges Grid (Sets/Reps, Duration, Frequency) */}
                  {(act.duration || act.sets || act.repetitions || act.frequency || act.difficulty) && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-[#7C3AED]/15 text-[11px] font-mono">
                      {act.duration && (
                        <div className="flex items-center gap-1.5 text-[#E9E2F5]" title="Duration / Hold time">
                          <Clock className="w-3 h-3 text-[#A78BFA] shrink-0" />
                          <span className="truncate">{act.duration}</span>
                        </div>
                      )}

                      {act.sets && act.repetitions ? (
                        <div className="flex items-center gap-1.5 text-[#E9E2F5]" title="Sets × Repetitions">
                          <Repeat className="w-3 h-3 text-[#F97368] shrink-0" />
                          <span className="truncate">
                            {act.sets} sets × {act.repetitions} reps
                          </span>
                        </div>
                      ) : act.sets ? (
                        <div className="flex items-center gap-1.5 text-[#E9E2F5]" title="Prescribed Sets">
                          <Repeat className="w-3 h-3 text-[#F97368] shrink-0" />
                          <span className="truncate">{act.sets} sets</span>
                        </div>
                      ) : act.repetitions ? (
                        <div className="flex items-center gap-1.5 text-[#E9E2F5]" title="Prescribed Repetitions">
                          <Repeat className="w-3 h-3 text-[#F97368] shrink-0" />
                          <span className="truncate">{act.repetitions} reps</span>
                        </div>
                      ) : null}

                      {act.frequency && (
                        <div className="flex items-center gap-1.5 text-[#E9E2F5]" title="Prescribed Frequency">
                          <Calendar className="w-3 h-3 text-[#10B981] shrink-0" />
                          <span className="truncate">{act.frequency}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Safety Note or Contraindication (Only when provided) */}
                  {act.safetyNote && (
                    <div className="p-3 rounded-xl bg-[#FFB020]/10 border border-[#FFB020]/25 text-[11px] text-[#FDBA8C] flex items-start gap-2">
                      <ShieldAlert className="w-3.5 h-3.5 text-[#FFB020] shrink-0 mt-0.5" />
                      <span className="leading-snug">{act.safetyNote}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── Empty Exercises State ─────────────────────────────────── */
        <div className="p-8 sm:p-10 rounded-2xl bg-[#18132D] border border-[#7C3AED]/25 text-center space-y-4 shadow-lg">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-[#21183A] border border-[#7C3AED]/35 flex items-center justify-center">
            <Dumbbell className="w-6 h-6 text-[#FDBA8C]" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base sm:text-lg font-bold text-[#FFFDF9]">
              Exercise recommendations are not available yet.
            </h3>
            <p className="text-xs text-[#B8AEC8] leading-relaxed">
              No specific activities were returned for this phase of your plan.
            </p>
          </div>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="px-4 py-2 rounded-xl bg-[#21183A] text-xs font-bold text-[#FFFDF9] border border-[#7C3AED]/40 hover:border-[#F97368] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Loading Exercises</span>
            </button>
          )}
        </div>
      )}
    </section>
  );
};

export default RecoveryActivitiesList;
