import React from "react";
import {
  CheckCircle2,
  Circle,
  Clock,
  Dumbbell,
  Repeat,
  ShieldAlert,
  Zap,
} from "lucide-react";
import type { RecoveryActivity } from "@/types/recovery";

interface RecoveryActivitiesListProps {
  phaseNumber: number;
  activities?: RecoveryActivity[];
  onToggleComplete?: (activityId: string) => void;
}

export const RecoveryActivitiesList: React.FC<RecoveryActivitiesListProps> = ({
  phaseNumber,
  activities = [],
  onToggleComplete,
}) => {
  const hasActivities = activities && activities.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Dumbbell className="w-4 h-4 text-[#FDBA8C]" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#FDBA8C] font-display">
            Phase {phaseNumber} Activities
          </h3>
        </div>
        <span className="text-xs text-[#B8AEC8]">
          {hasActivities ? `${activities.length} Activities` : "Pending Generation"}
        </span>
      </div>

      {hasActivities ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activities.map((act) => (
            <div
              key={act.id}
              className={`p-5 rounded-2xl border transition-all duration-300 space-y-3 relative overflow-hidden group ${
                act.completed
                  ? "bg-[#18132D]/50 border-[#10B981]/30 opacity-75"
                  : "bg-[#18132D] border-[#7C3AED]/25 hover:border-[#7C3AED]/50 hover:-translate-y-0.5 shadow-lg"
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-[#FDBA8C] px-2 py-0.5 rounded-md bg-[#7C3AED]/15 border border-[#7C3AED]/25 inline-block">
                    {act.targetArea}
                  </span>
                  <h4 className="text-base font-bold text-[#FFFDF9] leading-snug">
                    {act.name}
                  </h4>
                </div>

                <button
                  type="button"
                  onClick={() => onToggleComplete && onToggleComplete(act.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    act.completed
                      ? "bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40"
                      : "bg-[#21183A] text-[#B8AEC8] hover:text-[#FFFDF9] border border-[#7C3AED]/30 hover:border-[#F97368]/50"
                  }`}
                >
                  {act.completed ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Completed</span>
                    </>
                  ) : (
                    <>
                      <Circle className="w-3.5 h-3.5" />
                      <span>Mark Complete</span>
                    </>
                  )}
                </button>
              </div>

              {/* Description */}
              <p className="text-xs text-[#B8AEC8] leading-relaxed">
                {act.description}
              </p>

              {/* Badges Grid */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#7C3AED]/15 text-[11px] font-mono">
                {act.duration && (
                  <div className="flex items-center gap-1 text-[#E9E2F5]">
                    <Clock className="w-3 h-3 text-[#A78BFA]" />
                    <span>{act.duration}</span>
                  </div>
                )}
                {act.sets && act.repetitions && (
                  <div className="flex items-center gap-1 text-[#E9E2F5]">
                    <Repeat className="w-3 h-3 text-[#F97368]" />
                    <span>{act.sets} × {act.repetitions}</span>
                  </div>
                )}
                {act.difficulty && (
                  <div className="flex items-center gap-1 capitalize text-[#FDBA8C]">
                    <Zap className="w-3 h-3 text-[#FDBA8C]" />
                    <span>{act.difficulty}</span>
                  </div>
                )}
              </div>

              {act.safetyNote && (
                <div className="p-2.5 rounded-xl bg-[#120D26]/70 border border-[#7C3AED]/20 text-[11px] text-[#B8AEC8] flex items-start gap-2">
                  <ShieldAlert className="w-3.5 h-3.5 text-[#FDBA8C] shrink-0 mt-0.5" />
                  <span>{act.safetyNote}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* ── Elegant Pending State for Future Activity Cards ─────────── */
        <div className="p-8 sm:p-10 rounded-3xl bg-[#18132D]/90 border-2 border-dashed border-[#7C3AED]/35 text-center space-y-5 shadow-xl relative overflow-hidden">
          {/* Ambient Glow */}
          <div
            className="absolute -top-16 -right-16 w-48 h-48 bg-[#7C3AED]/15 rounded-full blur-2xl pointer-events-none"
            aria-hidden="true"
          />

          <div className="w-14 h-14 mx-auto rounded-2xl bg-[#21183A] border border-[#7C3AED]/40 flex items-center justify-center shadow-md">
            <Dumbbell className="w-7 h-7 text-[#FDBA8C]" />
          </div>

          <div className="max-w-md mx-auto space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#7C3AED]/20 border border-[#7C3AED]/35 text-[11px] font-bold uppercase tracking-wider text-[#FDBA8C]">
              <span>Phase {phaseNumber} Activity Pipeline</span>
            </div>
            <h4 className="text-lg sm:text-xl font-bold font-display text-[#FFFDF9] tracking-tight">
              Recovery activities will appear here.
            </h4>
            <p className="text-xs sm:text-sm text-[#B8AEC8] leading-relaxed">
              Specific active recovery drills, guided mobility sequences, and progressive load exercises will be tailored to your kinetic chain once the recommendation engine is connected.
            </p>
          </div>

          {/* Activity Card Blueprint Preview */}
          <div className="max-w-md mx-auto p-4 rounded-2xl bg-[#120D26]/60 border border-[#7C3AED]/20 text-left space-y-3 opacity-60">
            <div className="flex items-center justify-between">
              <div className="h-3 w-28 bg-[#7C3AED]/30 rounded-md" />
              <div className="h-6 w-20 bg-[#7C3AED]/20 rounded-lg" />
            </div>
            <div className="h-4 w-44 bg-[#FFFDF9]/20 rounded-md" />
            <div className="h-2.5 w-full bg-[#B8AEC8]/15 rounded-md" />
            <div className="flex gap-2 pt-2 border-t border-[#7C3AED]/10">
              <div className="h-4 w-16 bg-[#7C3AED]/20 rounded" />
              <div className="h-4 w-16 bg-[#F97368]/20 rounded" />
              <div className="h-4 w-16 bg-[#FDBA8C]/20 rounded" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
