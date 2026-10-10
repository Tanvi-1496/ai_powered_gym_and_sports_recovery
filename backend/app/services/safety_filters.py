from typing import Any
from app.schemas.exercises import (
    ExerciseAssessmentRequest,
    SafetyEvaluation,
    MaxIntensity,
)

# Clinical Red-Flag keywords that mandate immediate withholding of physical exercises
RED_FLAG_KEYWORDS: list[str] = [
    "numbness",
    "tingling",
    "pins and needles",
    "loss of sensation",
    "inability to bear weight",
    "cannot bear weight",
    "joint locking",
    "deformity",
    "suspected fracture",
    "bone fracture",
    "dislocation",
    "unreduced",
    "loss of bowel",
    "loss of bladder",
    "cauda equina",
    "fever with joint swelling",
]

# Standardized restriction code to movement tag mappings
RESTRICTION_CODE_TAG_MAP: dict[str, list[str]] = {
    "RESTRICT_OVERHEAD": ["overhead_press", "overhead_mobility"],
    "RESTRICT_DEEP_FLEXION": ["deep_knee_flexion", "partial_flexion"],
    "RESTRICT_IMPACT": ["impact_load", "impact_absorption"],
    "RESTRICT_AXIAL_LOAD": ["axial_load", "heavy_load"],
    "RESTRICT_SPINAL_FLEXION": ["spinal_mobility", "spinal_flexion"],
    "RESTRICT_ECCENTRIC_STRAIN": ["eccentric_loading", "eccentric_stretch"],
    "RESTRICT_ROTATION": ["rotational_torque", "multi_planar_mobility"],
}

# Intensity hierarchy for comparison
INTENSITY_RANKS: dict[str, int] = {
    "gentle": 1,
    "moderate": 2,
    "advanced": 3,
    "unrestricted": 99,
}


def check_red_flags(assessment: ExerciseAssessmentRequest) -> tuple[bool, str | None]:
    """
    Check symptoms and movement limitations for clinical red-flag indicators.
    Returns (has_red_flags, explanation).
    """
    reported_texts = [s.lower() for s in assessment.symptoms] + [
        lim.lower() for lim in assessment.movement_limitations
    ]
    all_text = " ".join(reported_texts)

    for rf in RED_FLAG_KEYWORDS:
        if rf in all_text:
            return (
                True,
                f"Red-flag symptom detected ('{rf}'). Physical exercise is withheld. "
                "Please obtain an immediate in-person medical evaluation before continuing physical activity.",
            )

    return False, None


def evaluate_assessment_safety(assessment: ExerciseAssessmentRequest) -> SafetyEvaluation:
    """
    First-pass safety triage of the incoming assessment.
    Determines if recommendations are allowed, whether conservative handling is required,
    and collects warnings.
    """
    eval_result = SafetyEvaluation()

    # 1. Missing / Insufficient body area check
    if not assessment.body_areas:
        eval_result.withhold_recommendation = True
        eval_result.is_safe = False
        eval_result.withhold_reason = "No target body area specified. Insufficient data to safely recommend exercises."
        return eval_result

    # 2. Check for clinical red flags
    has_red_flags, red_flag_reason = check_red_flags(assessment)
    if has_red_flags:
        eval_result.withhold_recommendation = True
        eval_result.is_safe = False
        eval_result.withhold_reason = red_flag_reason
        eval_result.warnings.append(red_flag_reason or "Red flag detected.")
        return eval_result

    # 3. Check for clinician-directed clearance block from Doctor Guidance module
    if assessment.doctor_guidance and assessment.doctor_guidance.medical_clearance_required:
        eval_result.withhold_recommendation = True
        eval_result.is_safe = False
        reason = (
            "Medical clearance is required by clinical guidance before initiating active recovery exercises."
        )
        if assessment.doctor_guidance.clinical_notes:
            reason += f" Doctor note: {assessment.doctor_guidance.clinical_notes}"
        eval_result.withhold_reason = reason
        eval_result.warnings.append(reason)
        return eval_result

    # 4. Severe pain handling (Pain >= 8):
    # As per clinician-reviewed guidance: severe pain triggers CONSERVATIVE HANDLING
    # (unloaded mobility / gentle isometric only), not a blind emergency withhold.
    if assessment.pain_severity >= 8:
        eval_result.is_conservative = True
        eval_result.warnings.append(
            f"High pain rating ({assessment.pain_severity}/10) recorded. Switching to conservative handling "
            "(gentle, unloaded active recovery and pain-free isometrics only). "
            "Please consult a physician or physical therapist if pain does not subside."
        )

    return eval_result


def is_exercise_allowed(
    exercise: dict[str, Any],
    assessment: ExerciseAssessmentRequest,
    safety_eval: SafetyEvaluation,
) -> tuple[bool, str | None]:
    """
    Evaluate an individual catalog exercise against doctor restrictions,
    movement limitations, intensity thresholds, and contraindications.
    Returns (is_allowed, exclusion_reason).
    """
    exercise_id = exercise.get("id", "unknown")
    ex_tags: list[str] = exercise.get("movement_tags", [])
    ex_difficulty: str = exercise.get("difficulty", "gentle").lower()
    contraindications: list[str] = exercise.get("contraindications", [])

    # Rule A: If conservative handling is active (e.g. pain >= 8), allow only 'gentle' exercises
    if safety_eval.is_conservative and ex_difficulty != "gentle":
        return False, f"Difficulty '{ex_difficulty}' exceeds conservative protocol threshold (gentle only)."

    # Rule B: Doctor Guidance intensity capping
    max_intensity: MaxIntensity = "unrestricted"
    if assessment.doctor_guidance:
        max_intensity = assessment.doctor_guidance.max_allowed_intensity

    # Take the stricter between conservative mode and doctor max_intensity
    if safety_eval.is_conservative:
        allowed_max_rank = 1  # gentle
    else:
        allowed_max_rank = INTENSITY_RANKS.get(max_intensity, 99)

    ex_rank = INTENSITY_RANKS.get(ex_difficulty, 1)
    if ex_rank > allowed_max_rank:
        return False, f"Exercise intensity '{ex_difficulty}' exceeds maximum permitted intensity '{max_intensity}'."

    # Rule C: Doctor Guidance disallowed movement tags
    doctor_disallowed_tags: set[str] = set()
    if assessment.doctor_guidance:
        doctor_disallowed_tags.update(assessment.doctor_guidance.disallowed_movement_tags)
        # Add tags mapped from restriction codes
        for code in assessment.doctor_guidance.restriction_codes:
            mapped_tags = RESTRICTION_CODE_TAG_MAP.get(code, [])
            doctor_disallowed_tags.update(mapped_tags)

    matching_disallowed = set(ex_tags).intersection(doctor_disallowed_tags)
    if matching_disallowed:
        return (
            False,
            f"Exercise movement tags {list(matching_disallowed)} conflict with doctor guidance restrictions.",
        )

    # Rule D: Movement limitations matching
    limitations_lower = " ".join([lim.lower() for lim in assessment.movement_limitations])
    if "cannot bend knee" in limitations_lower or "limited knee flexion" in limitations_lower:
        if "partial_flexion" in ex_tags or "knee_flexion" in ex_tags:
            return False, "Exercise involves knee flexion which conflicts with self-reported knee bend limitation."

    if "cannot lift arm" in limitations_lower or "overhead" in limitations_lower:
        if "overhead_mobility" in ex_tags or "overhead_press" in ex_tags:
            return False, "Exercise involves overhead motion which conflicts with reported upper limb limitation."

    return True, None


def filter_candidate_exercises(
    candidates: list[dict[str, Any]],
    assessment: ExerciseAssessmentRequest,
    safety_eval: SafetyEvaluation,
) -> tuple[list[dict[str, Any]], list[dict[str, str]]]:
    """
    Run candidate exercises through safety filters.
    Returns (allowed_exercises, excluded_audit_log).
    """
    allowed: list[dict[str, Any]] = []
    excluded: list[dict[str, str]] = []

    for ex in candidates:
        is_ok, reason = is_exercise_allowed(ex, assessment, safety_eval)
        if is_ok:
            allowed.append(ex)
        else:
            excluded.append({
                "exercise_id": ex.get("id", "unknown"),
                "name": ex.get("name", "Unknown"),
                "reason": reason or "Excluded by safety filter.",
            })

    return allowed, excluded
