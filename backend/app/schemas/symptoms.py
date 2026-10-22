"""Pydantic schemas for Gemini AI Symptom & Body Area Interpretation.

Validates athlete natural-language symptom inputs, structured interpretation output,
and clinical safety notices.
"""

from typing import List, Literal, Optional
from pydantic import BaseModel, Field


class SymptomInterpretationRequest(BaseModel):
    """Input payload for natural language symptom and body area interpretation."""
    text: str = Field(
        ...,
        min_length=1,
        max_length=1000,
        description="Athlete free-text description of pain, discomfort, or affected body part",
        examples=["My left shoulder hurts when I raise my arm above my head."],
    )
    activity_context: Optional[str] = Field(
        default=None,
        description="Optional context such as 'during squats', 'overhead press', or 'running'",
    )
    sport: Optional[str] = Field(
        default=None,
        description="Primary sport or training modality (e.g. 'weightlifting', 'running')",
    )


class InterpretedSymptomItem(BaseModel):
    """Single interpreted anatomical symptom entity."""
    body_area: str = Field(
        ...,
        description="Identified anatomical area in plain English (e.g. 'shoulder', 'knee', 'lower back')",
    )
    canonical_body_area: str = Field(
        default="general",
        description="Standardized canonical zone: 'knee', 'shoulder', 'lower_back', 'hamstring', 'ankle', 'hip', 'neck', or 'general'",
    )
    side: Literal["left", "right", "bilateral", "center", "unspecified"] = Field(
        default="unspecified",
        description="Laterality: 'left', 'right', 'bilateral', 'center', or 'unspecified'",
    )
    symptom_type: str = Field(
        default="pain",
        description="Identified sensation: 'pain', 'stiffness', 'swelling', 'weakness', 'tenderness', 'numbness_tingling', 'reduced_movement', or 'other'",
    )
    trigger: Optional[str] = Field(
        default=None,
        description="Specific mechanical movement or loading trigger if mentioned (e.g. 'raising arm overhead', 'deep knee flexion')",
    )
    anatomical_structure: str = Field(
        default="unknown",
        description="Specific muscle/ligament/tendon only if explicitly supported by description (e.g. 'rotator cuff'); otherwise 'unknown'",
    )
    duration: Optional[str] = Field(
        default=None,
        description="Symptom duration if stated in user description (e.g. '3 days', '2 weeks'); otherwise None",
    )
    confidence: float = Field(
        default=0.85,
        ge=0.0,
        le=1.0,
        description="Interpretation confidence score (0.0 to 1.0)",
    )
    matched_manifest_id: Optional[str] = Field(
        default=None,
        description="ID of corresponding 3D anatomy viewer structure if identifiable (e.g. 'left-shoulder', 'left-rotator-cuff')",
    )


class GeminiInterpretationOutput(BaseModel):
    """Structured output expected from Gemini model."""
    items: List[InterpretedSymptomItem] = Field(
        default_factory=list,
        description="List of recognized anatomical symptom entities",
    )
    primary_body_area: str = Field(
        default="general",
        description="Primary canonical body area",
    )
    needs_clarification: bool = Field(
        default=False,
        description="True if the description is ambiguous, too vague, or missing essential location/action info",
    )
    clarifying_question: Optional[str] = Field(
        default=None,
        description="A short, helpful question if essential information is unclear",
    )
    reasoning: Optional[str] = Field(
        default=None,
        description="Brief non-clinical explanation of how the description was structured",
    )


class SymptomInterpretationResponse(BaseModel):
    """Full API response returned to client."""
    raw_text: str = Field(description="Original user text input")
    status: Literal["success", "clarification_needed", "fallback", "error"] = Field(
        description="Status of the interpretation"
    )
    items: List[InterpretedSymptomItem] = Field(
        default_factory=list,
        description="List of structured anatomical entities identified",
    )
    primary_body_area: str = Field(
        default="general",
        description="Primary canonical zone for downstream exercise and recovery mapping",
    )
    canonical_body_areas: List[str] = Field(
        default_factory=list,
        description="Deduplicated list of all canonical zones identified across items",
    )
    manifest_part_ids: List[str] = Field(
        default_factory=list,
        description="Matched 3D anatomy part IDs for viewer highlighting",
    )
    needs_clarification: bool = Field(
        default=False,
        description="Whether the user should be prompted for more specific details",
    )
    clarifying_question: Optional[str] = Field(
        default=None,
        description="Clarification prompt for ambiguous descriptions",
    )
    model_used: Optional[str] = Field(
        default=None,
        description="Model identifier or 'deterministic_fallback'",
    )
    is_fallback: bool = Field(
        default=False,
        description="True if rule-based fallback was used instead of live Gemini API",
    )
    red_flag_warning: Optional[str] = Field(
        default=None,
        description="Emergency or clinical alert if dangerous symptoms are detected in the description",
    )
    clinical_notice: str = Field(
        default=(
            "REVORA AI symptom interpretation structures natural-language athlete descriptions for biomechanical telemetry. "
            "It does NOT diagnose medical conditions, replace clinician evaluation, or alter emergency triage protocols."
        )
    )
