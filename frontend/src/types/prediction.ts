// prediction.ts
// Data contracts for Future REVORA Machine Learning & Biomechanical Prediction Services.
// This phase defines the clean interface contracts without fake prediction logic.

import type { AssessmentData } from "@/services/assessment";

/**
 * Clean AssessmentInput contract fed to the future prediction engine.
 */
export type AssessmentInput = AssessmentData;

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
 * Contract representing the output of future trained ML prediction models.
 * In Phase 5, all fields remain null/empty/pending until the neural prediction service is integrated.
 */
export interface PredictionResult {
  riskLevel: "low" | "moderate" | "elevated" | "high" | null;
  riskScore: number | null; // e.g. 0 - 100
  predictedInjury: string | null;
  confidence: number | null; // e.g. 0.0 - 1.0
  contributingFactors: ContributingFactor[] | null;
  status: "pending_model_integration" | "analyzing" | "completed" | "error";
  modelMetadata?: {
    engineName: string;
    modelVersion: string;
    inferenceLatencyMs?: number;
    trainingDataset?: string;
  };
}
