from typing import Any
from fastapi import APIRouter

from app.core.config import settings
from app.schemas.symptoms import (
    SymptomInterpretationRequest,
    SymptomInterpretationResponse,
)
from app.services.symptom_interpreter import interpret_symptom

router = APIRouter()


@router.post(
    "/interpret",
    response_model=SymptomInterpretationResponse,
    summary="Interpret free-text symptom and body area descriptions using Gemini AI",
    description=(
        "Converts natural-language symptom descriptions into validated anatomical telemetry "
        "(canonical body areas, laterality, symptom sensations, movement triggers) "
        "with strict clinical safety boundaries and deterministic rule fallback."
    ),
)
def interpret_symptom_description(
    payload: SymptomInterpretationRequest,
) -> SymptomInterpretationResponse:
    """Natural-language symptom interpretation endpoint."""
    return interpret_symptom(payload)


@router.get(
    "/status",
    summary="Symptom interpreter engine and model status",
    description="Returns configuration status of the Gemini symptom interpretation engine.",
)
def symptom_interpreter_status() -> dict[str, Any]:
    """Check if Gemini API is configured and operational."""
    has_key = bool(settings.GEMINI_API_KEY and len(settings.GEMINI_API_KEY.strip()) > 5)
    return {
        "status": "configured" if has_key else "fallback_only",
        "service": "symptom-interpreter",
        "provider": "google-gemini" if has_key else "deterministic-rules",
        "model": settings.GEMINI_MODEL if has_key else "deterministic-fallback",
        "gemini_available": has_key,
        "clinical_role": "natural_language_interpretation_only",
        "diagnostic_disclaimer": "REVORA does not provide certified medical diagnoses.",
    }
