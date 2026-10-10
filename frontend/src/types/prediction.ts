// prediction.ts
// Data contracts for Future REVORA Machine Learning & Biomechanical Prediction Services.
// This defines clean interface contracts for upcoming teammate-developed models without fake prediction logic.

import type { AssessmentData } from "@/services/assessment";

/**
 * Clean AssessmentInput contract fed to the future prediction engine.
 */
export type AssessmentInput = AssessmentData;

/**
 * Severity / Urgency level for future clinical triage.
 */
export type TriageUrgencyLevel = "self_care" | "conservative_management" | "clinical_evaluation" | "urgent_medical";

/**
 * Biomechanical or workload contributing factor derived by future models.
 */
export interface ContributingFactor {
  id: string;
  name: string;
  category: "workload" | "biomechanical" | "symptom_pattern" | "kinetic_chain";
  weight?: number; // Normalized importance weight 0.0 - 1.0
  impactLevel?: "high" | "moderate" | "low";
  summary?: string;
}

/**
 * Contract representing the output of future trained Biomechanical Injury-Risk ML models.
 * When integrated, models will return calibrated probabilities and contributing factors.
 */
export interface BiomechanicalRiskPrediction {
  riskLevel: "low" | "moderate" | "elevated" | "high" | null;
  riskScore: number | null; // 0 - 100
  predictedRiskArea: string | null;
  confidence: number | null; // 0.0 - 1.0
  contributingFactors: ContributingFactor[] | null;
  explanation?: string | null;
  status: "pending_model_integration" | "analyzing" | "completed" | "error";
  modelMetadata?: {
    engineName: string;
    modelVersion: string;
    inferenceLatencyMs?: number;
    trainingDataset?: string;
  };
}

/**
 * Backward-compatible alias for PredictionResult.
 */
export type PredictionResult = BiomechanicalRiskPrediction;

/**
 * Contract representing future Clinical Triage & Physical Therapy Guidance recommendations.
 */
export interface ClinicalTriageGuidance {
  urgency: TriageUrgencyLevel;
  primaryRecommendation: string;
  contraindications: string[];
  explanation?: string | null;
  suggestedFollowUpDays?: number;
  referralRecommended: boolean;
  disclaimer: string;
  status: "pending_service_integration" | "available" | "error";
}
