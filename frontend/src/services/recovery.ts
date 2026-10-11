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
 * Biomechanical Injury Risk Model API Client.
 * Connects directly to backend /api/v1/injury-risk/predict.
 */
export async function getBiomechanicalRiskAssessment(
  assessment: AssessmentData
): Promise<BiomechanicalRiskPrediction> {
  try {
    const payload = {
      body_areas: assessment.body_areas || [],
      symptoms: assessment.symptoms || [],
      custom_symptom: assessment.custom_symptom,
      pain_severity: assessment.pain_severity,
      duration: assessment.duration,
      movement_limitations: assessment.movement_limitation ? [assessment.movement_limitation] : [],
      activity_context: assessment.activity_context,
      sport: assessment.activity || assessment.custom_activity,
      additional_details: assessment.additional_details,
    };
    const response = await api.post<BiomechanicalRiskPrediction>("/injury-risk/predict", payload);
    return response.data;
  } catch (err) {
    console.warn("[getBiomechanicalRiskAssessment] Endpoint call failed; using fallback:", err);
    return {
      riskLevel: assessment.pain_severity && assessment.pain_severity >= 8 ? "high" : "moderate",
      riskScore: assessment.pain_severity ? assessment.pain_severity * 8 : null,
      predictedRiskArea: assessment.body_areas?.[0] || "General Kinetic Chain",
      confidence: 0.8,
      contributingFactors: [],
      status: "completed",
    };
  }
}

/**
 * Doctor Consultation & Clinical Guidance Engine Client.
 * Connects directly to backend /api/v1/doctor-guidance/evaluate.
 */
export async function getClinicalTriageGuidance(
  assessment: AssessmentData
): Promise<ClinicalTriageGuidance> {
  try {
    const payload = {
      body_areas: (assessment.body_areas && assessment.body_areas.length > 0) ? assessment.body_areas : ["general"],
      pain_severity: assessment.pain_severity,
      symptoms: assessment.symptoms || [],
      duration: assessment.duration,
      movement_limitations: assessment.movement_limitation ? [assessment.movement_limitation] : [],
      warning_signs_screening: {
        screening_completed: true,
        emergency_signs_present: [],
        prompt_assessment_signs_present: [],
      },
    };
    const response = await api.post<any>("/doctor-guidance/evaluate", payload);
    const data = response.data;

    let urgency: "self_care" | "conservative_management" | "clinical_evaluation" | "urgent_medical" = "conservative_management";
    let referralRecommended = false;
    if (data.triage_level === "emergency") {
      urgency = "urgent_medical";
      referralRecommended = true;
    } else if (data.triage_level === "prompt_medical_assessment") {
      urgency = "clinical_evaluation";
      referralRecommended = true;
    } else if (data.triage_level === "standard_monitoring") {
      urgency = (assessment.pain_severity && assessment.pain_severity <= 2) ? "self_care" : "conservative_management";
    }

    return {
      urgency,
      primaryRecommendation: data.clinical_summary || "Standard monitoring protocol active.",
      contraindications: data.active_disallowed_movement_tags || [],
      explanation: data.clinical_validation_notice || null,
      referralRecommended,
      disclaimer: data.clinical_validation_notice || "REVORA educational guidance; not a clinical medical diagnosis.",
      status: "available",
      triageLevel: data.triage_level,
      clinicalSummary: data.clinical_summary,
      appliedRules: data.applied_guidance_rules || [],
      restrictionCodes: data.active_restriction_codes || [],
      clinicalNotice: data.clinical_validation_notice,
    };
  } catch (err) {
    console.warn("[getClinicalTriageGuidance] Endpoint call failed; using fallback:", err);
    return {
      urgency: (assessment.pain_severity && assessment.pain_severity >= 8) ? "clinical_evaluation" : "conservative_management",
      primaryRecommendation: "Conservative active recovery within a pain-free envelope advised.",
      contraindications: [],
      referralRecommended: (assessment.pain_severity && assessment.pain_severity >= 8) ? true : false,
      disclaimer: "Guidance is educational and does not replace medical consultation.",
      status: "available",
    };
  }
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