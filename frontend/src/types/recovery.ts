// recovery.ts
// Data contracts for REVORA Recovery & Rehabilitation Recommendation Engine.
// Clean interface separation: AssessmentInput -> TelemetryCheckin -> RecoveryScore -> RecoveryPlan.

import type { AssessmentData } from "@/services/assessment";
import type { PredictionResult, BiomechanicalRiskPrediction } from "./prediction";

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
  instructions?: string[] | string;
  videoThumbnailUrl?: string;
  mediaUrl?: string;
}

export interface RecoveryPhase {
  id: string;
  phaseNumber: number;
  name: string;
  title?: string;
  subtitle?: string;
  status: "active" | "locked" | "completed" | "pending_generation" | "current";
  duration: string; // e.g., "Days 1-3" or "Week 1"
  summary?: string;
  activities: RecoveryActivity[];
}

export interface RecoveryPlan {
  id: string;
  userId?: string;
  user_id?: string;
  status: "active" | "ready" | "insufficient_data" | "pending_recommendation_engine" | "generating" | "completed" | string;
  currentPhaseNumber: number;
  totalPhases: number;
  overallProgressPct: number;
  estimatedDuration: string;
  primarySport?: string;
  targetAreas: string[];
  phases: RecoveryPhase[];
  safetyGuidelines: string[];
  recoveryScore?: number;
  readinessTier?: string;
  disclaimer: string;
  createdAt?: string;
  sourcePrediction?: PredictionResult | BiomechanicalRiskPrediction | null;
  sourceAssessment?: AssessmentData | null;
}
