from typing import Any
from fastapi import APIRouter, Query

from app.schemas.guidance import (
    AthleteClinicalPresentation,
    ClinicianClearanceSubmission,
    ClearanceValidationResult,
    GuidanceEvaluationResponse,
    GuidanceRuleSchema,
)
from app.services.doctor_guidance import (
    evaluate_doctor_guidance,
    validate_clinician_clearance,
    get_all_guidance_rules,
    get_restriction_code_catalog,
)

router = APIRouter()


@router.post(
    "/evaluate",
    response_model=GuidanceEvaluationResponse,
    summary="Evaluate athlete clinical presentation and generate doctor guidance",
    description=(
        "Module 2 triage engine: audits red flags with emergency priority, validates clinician clearance, "
        "detects contradictions, handles missing screening explicitly, applies reviewed clinical rules, "
        "and produces the exact DoctorGuidanceInput payload for Module 3."
    ),
)
def evaluate_presentation(
    payload: AthleteClinicalPresentation,
) -> GuidanceEvaluationResponse:
    return evaluate_doctor_guidance(payload)


@router.post(
    "/clearance/validate",
    response_model=ClearanceValidationResult,
    summary="Validate clinician clearance submission",
    description=(
        "Stand-alone clearance verification workflow. Enforces authorized healthcare provider credentials, "
        "jurisdiction, signed clinical declaration, and non-expired evaluation date while rejecting athlete self-reports."
    ),
)
def validate_clearance(
    payload: ClinicianClearanceSubmission,
) -> ClearanceValidationResult:
    return validate_clinician_clearance(payload)


@router.post(
    "/safety-check",
    response_model=GuidanceEvaluationResponse,
    summary="Evaluate presentation safety and red flag triage",
    description="Stand-alone clinical safety check auditing emergency and prompt-assessment warning signs, contradictions, and clearance validity.",
)
def check_guidance_safety(
    payload: AthleteClinicalPresentation,
) -> GuidanceEvaluationResponse:
    return evaluate_doctor_guidance(payload)


@router.get(
    "/rules",
    response_model=list[GuidanceRuleSchema],
    summary="List clinical guidance rules",
    description="Returns registry of clinical guidance rules with citations, evidence summaries, and review status.",
)
def list_guidance_rules(
    approved_only: bool = Query(
        default=False,
        description="If True, only returns rules with review_status 'approved'.",
    ),
) -> list[GuidanceRuleSchema]:
    return get_all_guidance_rules(approved_only=approved_only)


@router.get(
    "/restrictions",
    response_model=list[dict[str, Any]],
    summary="List standardized restriction codes",
    description="Returns standardized restriction codes and their mapped movement tags used across Module 2 and Module 3.",
)
def list_restriction_codes() -> list[dict[str, Any]]:
    return get_restriction_code_catalog()


@router.get(
    "/health",
    summary="Doctor guidance service health check",
    description="Returns health status and total loaded clinical rules count for Module 2.",
)
def guidance_health() -> dict[str, Any]:
    return {
        "status": "healthy",
        "service": "doctor-guidance",
        "rules_count": len(get_all_guidance_rules()),
    }
