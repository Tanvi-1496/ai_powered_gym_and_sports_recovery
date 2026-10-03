// recovery.ts
// Data contracts for Future REVORA Recovery & Rehabilitation Recommendation Engine.
// Clean interface separation: AssessmentInput -> PredictionResult -> RecoveryPlan.
// Phase 6 UI-first architecture: strictly no fake medical logic or hardcoded exercises.

import type { AssessmentData } from "@/services/assessment";
import type { PredictionResult } from "./prediction";

export type ActivityDifficulty = "gentle" | "moderate" | "advanced";

export interface RecoveryActivity {
  id: string;
  name: string;
  description: string;
  targetArea: string;
  duration?: string; // e.g., "5 mins" or "30s hold"
  sets?: number;
  repetitions?: number;
  frequency?: string; // e.g., "2x daily"
  difficulty?: ActivityDifficulty;
  completed?: boolean;
  safetyNote?: string;
  videoThumbnailUrl?: string;
}

export interface RecoveryPhase {
  id: string;
  phaseNumber: number;
  name: string;
  status: "locked" | "current" | "completed" | "pending_generation";
  duration?: string; // e.g., "Days 1-3"
  summary?: string;
  activities: RecoveryActivity[];
}

export interface RecoveryPlan {
  id: string;
  assessmentId?: string;
  status: "pending_recommendation_engine" | "generating" | "active" | "completed";
  currentPhaseNumber: number;
  totalPhases: number;
  overallProgressPct: number | null; // null when no real plan is generated
  estimatedDuration: string | null;
  targetAreas: string[];
  phases: RecoveryPhase[];
  safetyGuidelines: string[];
  createdAt?: string;
  sourcePrediction?: PredictionResult | null;
  sourceAssessment?: AssessmentData | null;
}
