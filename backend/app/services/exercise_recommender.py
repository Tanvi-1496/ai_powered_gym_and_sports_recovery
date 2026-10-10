from typing import Any
import logging
from app.schemas.exercises import (
    ExerciseAssessmentRequest,
    ExerciseRecommendationResponse,
    RecoveryActivitySchema,
    RecoveryPhaseSchema,
    RecoveryPlanSchema,
)
from app.services.exercise_catalog import (
    get_exercises_for_multiple_areas,
    normalize_body_area,
)
from app.services.safety_filters import (
    evaluate_assessment_safety,
    filter_candidate_exercises,
)

logger = logging.getLogger(__name__)


def _format_activity(
    ex: dict[str, Any],
    assessment: ExerciseAssessmentRequest,
    is_conservative: bool,
) -> RecoveryActivitySchema:
    """
    Format a catalog dictionary into the frontend-compatible RecoveryActivitySchema.
    Adapts safety notes, volume, and instructions based on user assessment telemetry.
    """
    precautions = ex.get("precautions", [])
    safety_note = "; ".join(precautions) if precautions else "Move slowly within pain-free threshold."
    if is_conservative:
        safety_note = (
            f"[Clinician-Supervised Conservative Mode: VAS {assessment.pain_severity}/10] "
            f"Execute strictly unloaded; stop immediately if discomfort intensifies. {safety_note}"
        )

    # Build description combining clinical purpose and instructions
    instructions_text = " ".join([f"{i+1}. {step}" for i, step in enumerate(ex.get("instructions", []))])
    full_desc = f"{ex.get('purpose', '')} Instructions: {instructions_text}"

    # Deload volume during high pain under clinician clearance
    sets = ex.get("default_sets", 3)
    if is_conservative and sets > 2:
        sets = 2

    return RecoveryActivitySchema(
        id=ex.get("id", ""),
        name=ex.get("name", "Recovery Drill"),
        description=full_desc,
        targetArea=ex.get("target_body_area", ""),
        duration=ex.get("default_duration"),
        sets=sets,
        repetitions=ex.get("default_reps"),
        frequency=ex.get("frequency", "Daily"),
        difficulty=ex.get("difficulty", "gentle"),
        safetyNote=safety_note,
        verifiedSources=ex.get("verified_sources", []),
        sourceUrls=ex.get("source_urls", []),
        reviewStatus=ex.get("review_status", "approved"),
    )


def recommend_exercises(
    assessment: ExerciseAssessmentRequest,
    catalog_override: list[dict[str, Any]] | None = None,
) -> ExerciseRecommendationResponse:
    """
    Core Python recommendation engine for Module 3.
    
    Triage Pipeline:
    1. Evaluate safety: separates emergency signs from prompt-assessment signs,
       withholds severe pain (>= 8/10) unless clinician clearance is explicitly granted.
    2. If safety requires withholding, returns withheld response immediately with triage level.
    3. Queries clinically approved catalog entries for targeted regions.
    4. Applies safety filters (doctor restriction codes, movement tags, intensity capping).
    5. Formats allowed exercises into RecoveryActivity objects.
    6. Returns clean recommendation response with clinical disclaimer.
    """
    normalized_areas = [normalize_body_area(a) for a in assessment.body_areas]

    # Step 1: Safety triage
    safety_eval = evaluate_assessment_safety(assessment)

    if safety_eval.withhold_recommendation:
        return ExerciseRecommendationResponse(
            status="withheld",
            triage_level=safety_eval.triage_level,
            activities=[],
            safety_summary=safety_eval.withhold_reason or "Recommendations withheld for clinical safety.",
            warnings=safety_eval.warnings,
            target_areas=normalized_areas,
            excluded_count=0,
        )

    # Step 2: Catalog querying (approved entries only)
    if catalog_override is not None:
        candidates = catalog_override
    else:
        candidates = get_exercises_for_multiple_areas(normalized_areas, approved_only=True)

    # Step 3: Filter candidates through safety rules
    allowed_exercises, excluded_log = filter_candidate_exercises(
        candidates=candidates,
        assessment=assessment,
        safety_eval=safety_eval,
    )

    if not allowed_exercises:
        summary_msg = "No suitable exercises found in catalog matching current assessment and safety restrictions."
        if excluded_log:
            summary_msg += f" {len(excluded_log)} exercises were excluded due to restrictions or review status."
        return ExerciseRecommendationResponse(
            status="no_match",
            triage_level=safety_eval.triage_level,
            activities=[],
            safety_summary=summary_msg,
            warnings=safety_eval.warnings,
            target_areas=normalized_areas,
            excluded_count=len(excluded_log),
        )

    # Step 4: Prioritize and cap exercises (max 3 per target area to prevent fatigue)
    area_buckets: dict[str, list[dict[str, Any]]] = {}
    for ex in allowed_exercises:
        target = normalize_body_area(ex.get("target_body_area", ""))
        area_buckets.setdefault(target, []).append(ex)

    selected: list[dict[str, Any]] = []
    for area, bucket in area_buckets.items():
        sorted_bucket = sorted(
            bucket,
            key=lambda x: 0 if x.get("difficulty") == "gentle" else 1,
        )
        selected.extend(sorted_bucket[:3])

    # Step 5: Format into RecoveryActivitySchema
    activities = [
        _format_activity(ex, assessment, safety_eval.is_conservative)
        for ex in selected
    ]

    status = "conservative_guidance" if safety_eval.is_conservative else "recommended"
    summary_text = (
        f"Generated {len(activities)} personalized recovery activities covering {', '.join(normalized_areas)}."
    )
    if safety_eval.is_conservative:
        summary_text += " Protocol operating under clinician-supervised conservative guidelines due to elevated pain."

    return ExerciseRecommendationResponse(
        status=status,
        triage_level=safety_eval.triage_level,
        activities=activities,
        safety_summary=summary_text,
        warnings=safety_eval.warnings,
        target_areas=normalized_areas,
        excluded_count=len(excluded_log),
    )


def build_recovery_plan(
    recommendation_response: ExerciseRecommendationResponse,
    assessment: ExerciseAssessmentRequest,
) -> RecoveryPlanSchema:
    """
    Adapter function: maps ExerciseRecommendationResponse into the complete
    multi-phase RecoveryPlan contract expected by the frontend RecoveryPlanPage.
    """
    phase1_activities = [
        a for a in recommendation_response.activities if a.difficulty == "gentle"
    ]
    phase2_activities = [
        a for a in recommendation_response.activities if a.difficulty != "gentle"
    ]

    phases: list[RecoveryPhaseSchema] = []

    phases.append(
        RecoveryPhaseSchema(
            id="phase_1_acute_deload",
            phaseNumber=1,
            name="Phase 1: Deload & Pain-Free Isometrics",
            status="current",
            duration="Days 1-4",
            summary="Focus on unloaded active recovery, inflammation management, and tissue tolerance.",
            activities=phase1_activities or recommendation_response.activities,
        )
    )

    if phase2_activities:
        phases.append(
            RecoveryPhaseSchema(
                id="phase_2_progressive_loading",
                phaseNumber=2,
                name="Phase 2: Progressive Mobilization",
                status="locked",
                duration="Days 5-10",
                summary="Gradual introduction of controlled active range and multi-planar stability.",
                activities=phase2_activities,
            )
        )

    return RecoveryPlanSchema(
        id=f"plan_{abs(hash(tuple(assessment.body_areas)))}",
        status="active" if recommendation_response.status in ("recommended", "conservative_guidance") else "pending_recommendation_engine",
        currentPhaseNumber=1,
        totalPhases=len(phases),
        overallProgressPct=0,
        estimatedDuration="1-2 weeks",
        targetAreas=assessment.body_areas,
        phases=phases,
        safetyGuidelines=[
            recommendation_response.clinical_disclaimer,
            *recommendation_response.warnings,
        ],
    )
