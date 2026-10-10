from typing import Any
from dataclasses import dataclass, field
from app.schemas.exercises import (
    ExerciseAssessmentRequest,
    SafetyEvaluation,
    MaxIntensity,
    TriageLevel,
)


@dataclass(frozen=True)
class WarningSignRule:
    """Auditable clinical warning-sign rule definition with explicit evidence citation."""
    rule_id: str
    category: TriageLevel
    trigger_keywords: list[str]
    clinical_description: str
    clinical_citation: str
    action_guidance: str


# Auditable clinical rules registry
WARNING_SIGN_RULES: list[WarningSignRule] = [
    # ── Emergency Warning Signs (Require immediate emergency/urgent medical evaluation) ──
    WarningSignRule(
        rule_id="EMERGENCY_CAUDA_EQUINA",
        category="emergency",
        trigger_keywords=[
            "loss of bowel",
            "loss of bladder",
            "saddle anesthesia",
            "numbness in groin",
            "cauda equina",
        ],
        clinical_description="Cauda equina compression symptoms (loss of bowel/bladder or saddle paresthesia).",
        clinical_citation="NICE Clinical Guideline [NG59]: Low back pain and sciatica — red flags for cauda equina syndrome.",
        action_guidance="Seek immediate emergency medical evaluation (emergency department) to evaluate spinal cord/cauda equina integrity.",
    ),
    WarningSignRule(
        rule_id="EMERGENCY_MOTOR_DEFICIT",
        category="emergency",
        trigger_keywords=[
            "sudden severe weakness",
            "foot drop",
            "loss of motor function",
            "progressive motor loss",
        ],
        clinical_description="Acute motor deficit or progressive paresis.",
        clinical_citation="American Academy of Orthopaedic Surgeons (AAOS): Clinical Practice Guideline on Cervical and Lumbar Radiculopathy.",
        action_guidance="Seek immediate emergency medical evaluation for acute neurological impairment.",
    ),
    WarningSignRule(
        rule_id="EMERGENCY_GROSS_DEFORMITY_FRACTURE",
        category="emergency",
        trigger_keywords=[
            "gross deformity",
            "bone protruding",
            "compound fracture",
            "dislocation",
            "unreduced",
            "visible bone",
            "suspected fracture",
            "bone fracture",
        ],
        clinical_description="Severe acute structural trauma, suspected unreduced dislocation, or skeletal deformity.",
        clinical_citation="Ottawa Knee & Ankle Rules / ACSM Acute Orthopaedic Trauma Protocol.",
        action_guidance="Seek immediate emergency orthopaedic evaluation before attempting any movement or loading.",
    ),
    WarningSignRule(
        rule_id="EMERGENCY_JOINT_SEPSIS_VASCULAR",
        category="emergency",
        trigger_keywords=[
            "fever with joint swelling",
            "hot red swollen joint with chills",
            "cold pale limb",
            "absent pulse in foot",
        ],
        clinical_description="Signs suspicious of acute septic arthritis or acute neurovascular compromise.",
        clinical_citation="British Society for Rheumatology (BSR): Guidelines for the Management of the Hot Swollen Joint.",
        action_guidance="Seek immediate emergency medical evaluation to rule out infectious joint effusion or vascular compromise.",
    ),

    # ── Prompt Professional Assessment Signs (Require prompt clinical evaluation, NOT emergency department) ──
    WarningSignRule(
        rule_id="PROMPT_NON_WEIGHT_BEARING",
        category="prompt_medical_assessment",
        trigger_keywords=[
            "inability to bear weight",
            "cannot bear weight",
            "unable to take 4 steps",
        ],
        clinical_description="Inability to bear weight following lower extremity trauma.",
        clinical_citation="Stiell et al. (1992, 1996), Ottawa Ankle and Knee Rules.",
        action_guidance="Prompt professional clinical assessment (e.g., within 24-48 hours) is advised by a physician or physical therapist.",
    ),
    WarningSignRule(
        rule_id="PROMPT_RADICULAR_SENSORY",
        category="prompt_medical_assessment",
        trigger_keywords=[
            "numbness",
            "tingling",
            "pins and needles",
            "loss of sensation",
            "radiating down arm",
            "radiating down leg",
        ],
        clinical_description="Peripheral sensory paresthesia or radiating neuropathic discomfort.",
        clinical_citation="North American Spine Society (NASS): Diagnosis and Treatment of Lumbar Radiculopathy.",
        action_guidance="A prompt in-person clinical assessment is advised to map sensory distribution before continuing unguided exercises.",
    ),
    WarningSignRule(
        rule_id="PROMPT_MECHANICAL_LOCKING",
        category="prompt_medical_assessment",
        trigger_keywords=[
            "joint locking",
            "knee locked",
            "true mechanical block",
            "cannot fully straighten",
        ],
        clinical_description="Mechanical joint locking indicative of meniscal, labral, or loose body entrapment.",
        clinical_citation="AAOS Clinical Practice Guideline: Management of Meniscal Tears.",
        action_guidance="A prompt orthopaedic clinical assessment is advised to rule out mechanical intra-articular entrapment.",
    ),
    WarningSignRule(
        rule_id="PROMPT_WORSENING_SYMPTOMS",
        category="prompt_medical_assessment",
        trigger_keywords=[
            "rapidly worsening",
            "rapidly deteriorating",
            "worsening daily",
            "escalating pain",
            "worsening symptoms",
        ],
        clinical_description="Progressive or rapidly escalating symptom trajectory.",
        clinical_citation="American College of Sports Medicine (ACSM): Guidelines for Exercise Testing and Prescription.",
        action_guidance="Symptoms appear to be escalating; self-directed exercise is paused. Please obtain a prompt clinical assessment.",
    ),
]

# Standardized restriction code to movement tag mappings (agreed Module 2 contract)
RESTRICTION_CODE_TAG_MAP: dict[str, list[str]] = {
    "RESTRICT_OVERHEAD": ["overhead_press", "overhead_mobility"],
    "RESTRICT_DEEP_FLEXION": ["deep_knee_flexion", "partial_flexion"],
    "RESTRICT_IMPACT": ["impact_load", "impact_absorption"],
    "RESTRICT_AXIAL_LOAD": ["axial_load", "heavy_load"],
    "RESTRICT_SPINAL_FLEXION": ["spinal_mobility", "spinal_flexion"],
    "RESTRICT_ECCENTRIC_STRAIN": ["eccentric_loading", "eccentric_stretch"],
    "RESTRICT_ROTATION": ["rotational_torque", "multi_planar_mobility"],
}

# Intensity rank hierarchy
INTENSITY_RANKS: dict[str, int] = {
    "gentle": 1,
    "moderate": 2,
    "advanced": 3,
    "unrestricted": 99,
}


def audit_warning_signs(
    assessment: ExerciseAssessmentRequest,
) -> tuple[TriageLevel, list[WarningSignRule]]:
    """
    Audit assessment against clinical warning-sign rules.
    Returns the highest triage level detected and matching rules.
    """
    reported_texts = [s.lower() for s in assessment.symptoms] + [
        lim.lower() for lim in assessment.movement_limitations
    ]
    all_text = " ".join(reported_texts)

    matching_rules: list[WarningSignRule] = []
    has_emergency = False
    has_prompt = False

    for rule in WARNING_SIGN_RULES:
        for kw in rule.trigger_keywords:
            if kw in all_text:
                matching_rules.append(rule)
                if rule.category == "emergency":
                    has_emergency = True
                elif rule.category == "prompt_medical_assessment":
                    has_prompt = True
                break

    if has_emergency:
        return "emergency", matching_rules
    if has_prompt:
        return "prompt_medical_assessment", matching_rules
    return "standard_monitoring", []


def evaluate_assessment_safety(
    assessment: ExerciseAssessmentRequest,
) -> SafetyEvaluation:
    """
    Clinical safety filter evaluation pipeline.
    
    Triage Hierarchy:
    1. Validate necessary data (missing body area -> withhold for insufficient data).
    2. Check emergency warning signs -> withhold with emergency triage level.
    3. Check clinician clearance block from Doctor Guidance -> withhold.
    4. Check prompt assessment signs -> withhold with prompt clinical assessment level.
    5. Handle high pain severity (VAS >= 8/10):
       - Do NOT blindly assume gentle isometrics are safe.
       - Do NOT stamp as an emergency solely based on the pain number.
       - If clinician clearance is NOT granted: withhold for prompt clinical assessment.
       - If clinician clearance IS granted: allow conservative handling under clinical oversight.
    6. If safe: assign standard monitoring with appropriate warnings.
    """
    eval_result = SafetyEvaluation()

    # 1. Missing / Insufficient body area check
    if not assessment.body_areas:
        eval_result.withhold_recommendation = True
        eval_result.is_safe = False
        eval_result.triage_level = "prompt_medical_assessment"
        eval_result.withhold_reason = (
            "Target body area was not provided. Information is insufficient to safely determine exercise suitability."
        )
        eval_result.warnings.append(eval_result.withhold_reason)
        return eval_result

    # 2. Warning signs audit (Emergency vs Prompt Assessment)
    triage_level, matched_rules = audit_warning_signs(assessment)
    eval_result.identified_warning_signs = [r.rule_id for r in matched_rules]

    if triage_level == "emergency":
        eval_result.withhold_recommendation = True
        eval_result.is_safe = False
        eval_result.triage_level = "emergency"
        rule_desc = "; ".join([f"{r.clinical_description} ({r.action_guidance})" for r in matched_rules if r.category == "emergency"])
        eval_result.withhold_reason = (
            f"Emergency clinical warning sign detected: {rule_desc}"
        )
        eval_result.warnings.append(eval_result.withhold_reason)
        return eval_result

    # 3. Doctor Guidance explicit clearance block
    if assessment.doctor_guidance and assessment.doctor_guidance.medical_clearance_required:
        eval_result.withhold_recommendation = True
        eval_result.is_safe = False
        eval_result.triage_level = "prompt_medical_assessment"
        reason = "Formal medical clearance is required by clinical doctor guidance before initiating exercises."
        if assessment.doctor_guidance.clinical_notes:
            reason += f" Provider note: {assessment.doctor_guidance.clinical_notes}"
        eval_result.withhold_reason = reason
        eval_result.warnings.append(reason)
        return eval_result

    # 4. Prompt Medical Assessment warning signs (e.g., numbness, weight-bearing deficit, rapid worsening)
    if triage_level == "prompt_medical_assessment":
        eval_result.withhold_recommendation = True
        eval_result.is_safe = False
        eval_result.triage_level = "prompt_medical_assessment"
        rule_desc = "; ".join([f"{r.clinical_description} ({r.action_guidance})" for r in matched_rules if r.category == "prompt_medical_assessment"])
        eval_result.withhold_reason = (
            f"Clinical indicator requiring professional assessment detected: {rule_desc}"
        )
        eval_result.warnings.append(eval_result.withhold_reason)
        return eval_result

    # 5. Severe Pain Handling (VAS >= 8/10):
    # Clinical principle: Pain >= 8 indicates intense acute tissue stress or central sensitization.
    # We do NOT assume gentle isometrics are safe on self-directed apps at this pain level.
    # Nor do we stamp it as an emergency solely based on the pain score.
    if assessment.pain_severity >= 8:
        has_clinician_clearance = (
            assessment.doctor_guidance is not None
            and assessment.doctor_guidance.clinician_clearance_granted
            and not assessment.doctor_guidance.medical_clearance_required
        )

        if not has_clinician_clearance:
            # Without explicit clinician clearance, withhold self-directed exercise for prompt assessment
            eval_result.withhold_recommendation = True
            eval_result.is_safe = False
            eval_result.triage_level = "prompt_medical_assessment"
            eval_result.withhold_reason = (
                f"Severe pain severity ({assessment.pain_severity}/10) reported without clinician-reviewed clearance. "
                "Self-directed exercise recommendations are withheld. A qualified in-person medical evaluation "
                "(by a physician or physical therapist) is advised to assess the underlying condition before starting exercises."
            )
            eval_result.warnings.append(eval_result.withhold_reason)
            return eval_result
        else:
            # Clinician explicitly reviewed and cleared conservative exercise
            eval_result.is_conservative = True
            eval_result.triage_level = "standard_monitoring"
            eval_result.warnings.append(
                f"Severe pain ({assessment.pain_severity}/10) managed under clinician-reviewed clearance. "
                "Restricted to strictly conservative, unloaded gentle drills. Stop immediately if pain intensifies."
            )

    return eval_result


def is_exercise_allowed(
    exercise: dict[str, Any],
    assessment: ExerciseAssessmentRequest,
    safety_eval: SafetyEvaluation,
) -> tuple[bool, str | None]:
    """
    Evaluate an individual catalog exercise against doctor restrictions,
    movement limitations, intensity thresholds, and review status.
    Returns (is_allowed, exclusion_reason).
    """
    exercise_id = exercise.get("id", "unknown")
    ex_tags: list[str] = exercise.get("movement_tags", [])
    ex_difficulty: str = exercise.get("difficulty", "gentle").lower()
    review_status: str = exercise.get("review_status", "pending_review")

    # Rule 0: Evidence audit check — only clinically approved exercises are recommended
    if review_status != "approved":
        return False, f"Exercise '{exercise_id}' review status is '{review_status}'. Excluded until full clinical audit approval."

    # Rule 1: If conservative handling is active, allow strictly 'gentle' exercises
    if safety_eval.is_conservative and ex_difficulty != "gentle":
        return False, f"Difficulty '{ex_difficulty}' exceeds conservative protocol threshold (gentle only)."

    # Rule 2: Doctor Guidance intensity capping
    max_intensity: MaxIntensity = "unrestricted"
    if assessment.doctor_guidance:
        max_intensity = assessment.doctor_guidance.max_allowed_intensity

    allowed_max_rank = 1 if safety_eval.is_conservative else INTENSITY_RANKS.get(max_intensity, 99)
    ex_rank = INTENSITY_RANKS.get(ex_difficulty, 1)
    if ex_rank > allowed_max_rank:
        return False, f"Exercise intensity '{ex_difficulty}' exceeds maximum permitted intensity '{max_intensity}'."

    # Rule 3: Doctor Guidance disallowed movement tags and restriction codes
    doctor_disallowed_tags: set[str] = set()
    if assessment.doctor_guidance:
        doctor_disallowed_tags.update(assessment.doctor_guidance.disallowed_movement_tags)
        for code in assessment.doctor_guidance.restriction_codes:
            mapped_tags = RESTRICTION_CODE_TAG_MAP.get(code, [])
            doctor_disallowed_tags.update(mapped_tags)

    matching_disallowed = set(ex_tags).intersection(doctor_disallowed_tags)
    if matching_disallowed:
        return (
            False,
            f"Exercise movement tags {list(matching_disallowed)} conflict with doctor guidance restrictions.",
        )

    # Rule 4: Movement limitations self-report matching
    limitations_lower = " ".join([lim.lower() for lim in assessment.movement_limitations])
    if ("cannot bend knee" in limitations_lower or "limited knee flexion" in limitations_lower) and (
        "partial_flexion" in ex_tags or "knee_flexion" in ex_tags
    ):
        return False, "Exercise involves knee flexion which conflicts with self-reported knee bend limitation."

    if ("cannot lift arm" in limitations_lower or "overhead" in limitations_lower) and (
        "overhead_mobility" in ex_tags or "overhead_press" in ex_tags
    ):
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
                "reason": reason or "Excluded by clinical safety filter.",
            })

    return allowed, excluded
