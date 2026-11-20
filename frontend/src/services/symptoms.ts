import { api } from "./api";

export interface InterpretedSymptomItem {
  body_area: string;
  canonical_body_area: string;
  side: "left" | "right" | "bilateral" | "center" | "unspecified";
  symptom_type: string;
  trigger?: string | null;
  anatomical_structure: string;
  duration?: string | null;
  confidence: number;
  matched_manifest_id?: string | null;
}

export interface SymptomInterpretationRequest {
  text: string;
  activity_context?: string;
  sport?: string;
}

export interface SymptomInterpretationResponse {
  raw_text: string;
  status: "success" | "clarification_needed" | "fallback" | "error";
  items: InterpretedSymptomItem[];
  primary_body_area: string;
  canonical_body_areas: string[];
  manifest_part_ids: string[];
  needs_clarification: boolean;
  clarifying_question?: string | null;
  model_used?: string | null;
  is_fallback: boolean;
  red_flag_warning?: string | null;
  clinical_notice: string;
}

export interface SymptomInterpreterStatus {
  status: string;
  service: string;
  provider: string;
  model: string;
  gemini_available: boolean;
  clinical_role: string;
  diagnostic_disclaimer: string;
}

/**
 * Interpret athlete free-text symptom or body-area descriptions using Gemini AI.
 * Falls back to deterministic rule-based analysis if the API is offline or unconfigured.
 */
export async function interpretSymptomDescription(
  payload: SymptomInterpretationRequest
): Promise<SymptomInterpretationResponse> {
  const response = await api.post<SymptomInterpretationResponse>(
    "/symptoms/interpret",
    payload
  );
  return response.data;
}

/**
 * Query symptom interpreter engine status and active Gemini model configuration.
 */
export async function getSymptomInterpreterStatus(): Promise<SymptomInterpreterStatus> {
  const response = await api.get<SymptomInterpreterStatus>("/symptoms/status");
  return response.data;
}
