from fastapi import APIRouter, HTTPException, Query
from typing import Any

from app.schemas.exercises import (
    ExerciseAssessmentRequest,
    ExerciseRecommendationResponse,
    SafetyEvaluation,
    RecoveryPlanSchema,
)
from app.services.exercise_catalog import (
    get_all_exercises,
    get_exercise_by_id,
    get_exercises_for_body_area,
)
from app.services.exercise_recommender import (
    recommend_exercises,
    build_recovery_plan,
)
from app.services.safety_filters import evaluate_assessment_safety

router = APIRouter()


@router.post(
    "/recommendations",
    response_model=ExerciseRecommendationResponse,
    summary="Generate personalized exercise recommendations",
    description="Evaluates assessment data, enforces doctor-guidance restrictions, audits clinical review status, and returns tailored exercises.",
)
def get_exercise_recommendations(
    payload: ExerciseAssessmentRequest,
) -> ExerciseRecommendationResponse:
    return recommend_exercises(assessment=payload)


@router.post(
    "/recovery-plan",
    response_model=RecoveryPlanSchema,
    summary="Generate a complete multi-phase RecoveryPlan",
    description="Convenience endpoint returning the full RecoveryPlan object expected by the frontend UI.",
)
def get_full_recovery_plan(
    payload: ExerciseAssessmentRequest,
) -> RecoveryPlanSchema:
    recommendations = recommend_exercises(assessment=payload)
    return build_recovery_plan(recommendations, payload)


@router.post(
    "/safety-check",
    response_model=SafetyEvaluation,
    summary="Evaluate assessment safety",
    description="Stand-alone triage check separating emergency signs from prompt-assessment indicators and checking guidance rules.",
)
def check_safety(
    payload: ExerciseAssessmentRequest,
) -> SafetyEvaluation:
    return evaluate_assessment_safety(payload)


@router.get(
    "/catalog",
    response_model=list[dict[str, Any]],
    summary="Get exercise catalog",
    description="Returns clinical exercise entries, optionally filtered by anatomical body area and review status.",
)
def list_catalog(
    body_area: str | None = Query(
        default=None,
        description="Filter catalog by anatomical region (e.g., 'knee', 'shoulder', 'lower_back').",
    ),
    approved_only: bool = Query(
        default=False,
        description="If True, only returns entries with review_status 'approved'.",
    ),
) -> list[dict[str, Any]]:
    if body_area:
        return get_exercises_for_body_area(body_area, approved_only=approved_only)
    return get_all_exercises(approved_only=approved_only)


@router.get(
    "/catalog/{exercise_id}",
    response_model=dict[str, Any],
    summary="Get single exercise details",
    description="Fetches detailed clinical data, precautions, and instructions for a specific exercise ID.",
)
def get_catalog_item(exercise_id: str) -> dict[str, Any]:
    exercise = get_exercise_by_id(exercise_id)
    if not exercise:
        raise HTTPException(
            status_code=404,
            detail=f"Exercise with id '{exercise_id}' not found in catalog.",
        )
    return exercise
