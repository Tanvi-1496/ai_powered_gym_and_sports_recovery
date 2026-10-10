// recovery.ts
// Service integration layer for REVORA Recovery Telemetry, ML Readiness Scoring, and Personalized Plan Protocols.

import { api } from "./api";
import type { AssessmentData } from "./assessment";
import type { BiomechanicalRiskPrediction, ClinicalTriageGuidance } from "@/types/prediction";
import type { RecoveryActivity, RecoveryPhase, RecoveryPlan } from "@/types/recovery";

// Re-export shared types for convenient unified consumer imports
export type { RecoveryActivity, RecoveryPhase, RecoveryPlan };
export type { BiomechanicalRiskPrediction, ClinicalTriageGuidance };

export interface RecoveryScoreResponse {
  score: number;
  recovery_score?: number;
  tier: "optimal" | "moderate" | "low" | "critical" | string;
  score_tier?: string;
  headline: string;
  summary: string;
  observed_features_count: number;
  imputed_features_count: number;
  contributing_factors: string[];
  disclaimer: string;
}

export interface RecoveryCheckin {
  id: number;
  user_id?: string;
  sleep_hours: number;
  resting_heart_rate: number;
  hrv_ms: number | null;
  soreness: number;
  energy_level: number;
  created_at: string;
  prediction?: RecoveryScoreResponse;
}

export interface RecoveryCheckinCreate {
  sleep_hours: number;
  resting_heart_rate: number;
  hrv_ms: number | null;
  soreness: number;
  energy_level: number;
}

export type RecoveryPlanResponse = RecoveryPlan;

/**
 * Fetch historical recovery check-ins for the authenticated athlete.
 */
export async function getRecoveryCheckins(): Promise<RecoveryCheckin[]> {
  const response = await api.get<RecoveryCheckin[]>("/recovery/checkins");
  return response.data;
}

/**
 * Record a new daily recovery telemetry check-in and trigger live ML recovery score evaluation.
 */
export async function createRecoveryCheckin(
  data: RecoveryCheckinCreate
): Promise<RecoveryCheckin> {
  const response = await api.post<RecoveryCheckin>("/recovery/checkins", data);
  return response.data;
}

/**
 * Run direct ExtraTrees ML inference for given recovery telemetry metrics.
 */
export async function predictRecoveryScore(
  data: RecoveryCheckinCreate
): Promise<RecoveryScoreResponse> {
  const response = await api.post<RecoveryScoreResponse>(
    "/recovery/predict-score",
    data
  );
  return response.data;
}

/**
 * Fetch or generate a personalized 4-phase recovery plan from backend API.
 */
export async function getPersonalizedRecoveryPlan(): Promise<RecoveryPlanResponse> {
  const response = await api.get<RecoveryPlanResponse>("/recovery/plan");
  return response.data;
}

/**
 * Future Integration Helper: Biomechanical Injury Risk Model
 * (Reserved for upcoming teammate-developed inference service; does not call unbuilt endpoints)
 */
export async function getBiomechanicalRiskAssessment(
  _assessment: AssessmentData
): Promise<BiomechanicalRiskPrediction> {
  // Returns safe pending integration state until teammate deploys backend inference endpoint
  return {
    riskLevel: null,
    riskScore: null,
    predictedRiskArea: null,
    confidence: null,
    contributingFactors: null,
    status: "pending_model_integration",
  };
}

/**
 * Future Integration Helper: Clinical Triage & Physical Therapy Guidance Engine
 * (Reserved for upcoming teammate-developed triage service; does not call unbuilt endpoints)
 */
export async function getClinicalTriageGuidance(
  _assessment: AssessmentData
): Promise<ClinicalTriageGuidance> {
  return {
    urgency: "conservative_management",
    primaryRecommendation: "Clinical triage service is currently in development.",
    contraindications: [],
    referralRecommended: false,
    disclaimer: "Pending clinical triage engine deployment.",
    status: "pending_service_integration",
  };
}

// ── User-Scoped Activity Progress Storage ─────────────────────────────────

const ACTIVITY_PROGRESS_KEY_PREFIX = "revora_activity_progress_";

export function getCompletedActivityIds(userId: string): string[] {
  try {
    const raw = localStorage.getItem(`${ACTIVITY_PROGRESS_KEY_PREFIX}${userId}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // ignore
  }
  return [];
}

export function saveCompletedActivityIds(userId: string, ids: string[]): void {
  try {
    localStorage.setItem(`${ACTIVITY_PROGRESS_KEY_PREFIX}${userId}`, JSON.stringify(ids));
  } catch {
    // ignore
  }
}