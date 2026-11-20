from datetime import date
from typing import Any
from dataclasses import dataclass, field

from app.schemas.exercises import (
    DoctorGuidanceInput,
    MaxIntensity,
    TriageLevel,
    ReviewStatus,
)
from app.schemas.guidance import (
    AthleteClinicalPresentation,
    ClinicianClearanceSubmission,
    ClearanceValidationResult,
    GuidanceEvaluationResponse,
    GuidanceRuleSchema,
    WarningSignsScreening,
)

# Standardized restriction code to movement tag mappings (strict contract with Module 3)
RESTRICTION_CODE_TAG_MAP: dict[str, list[str]] = {
    "RESTRICT_OVERHEAD": ["overhead_press", "overhead_mobility"],
    "RESTRICT_DEEP_FLEXION": ["deep_knee_flexion", "partial_flexion"],
    "RESTRICT_IMPACT": ["impact_load", "impact_absorption"],
    "RESTRICT_AXIAL_LOAD": ["axial_load", "heavy_load"],
    "RESTRICT_SPINAL_FLEXION": ["spinal_mobility", "spinal_flexion"],
    "RESTRICT_ECCENTRIC_STRAIN": ["eccentric_loading", "eccentric_stretch"],
    "RESTRICT_ROTATION": ["rotational_torque", "multi_planar_mobility"],
}

INTENSITY_RANKS: dict[str, int] = {
    "gentle": 1,
    "moderate": 2,
    "advanced": 3,
    "unrestricted": 99,
}

AUTHORIZED_CLINICIAN_ROLES = {
    "sports_physician",
    "orthopedic_surgeon",
    "physiatrist",
    "physical_therapist",
    "athletic_trainer",
    "general_practitioner",
}


@dataclass(frozen=True)
class ClinicalGuidanceRule:
    """
    Internal auditable clinical guidance rule definition.
    Distinguishes approved institutional rules from unreviewed/pending ones.
    """
    rule_id: str
    name: str
    target_body_area: str
    review_status: ReviewStatus
    clinical_citation: str
    evidence_summary: str
    trigger_keywords: list[str]
    restriction_codes: list[str]
    disallowed_movement_tags: list[str]
    max_allowed_intensity: MaxIntensity


CLINICAL_GUIDANCE_RULES: list[ClinicalGuidanceRule] = [
    ClinicalGuidanceRule(
        rule_id="RULE_PATELLOFEMORAL_FLEXION",
        name="Patellofemoral Pain Flexion Restriction Protocol",
        target_body_area="knee",
        review_status="approved",
        clinical_citation="Crossley KM, et al. 2016 Patellofemoral pain consensus statement from the 4th International Patellofemoral Pain Research Retreat, Manchester. Br J Sports Med 2016;50:839-843.",
        evidence_summary="In acute patellofemoral pain, reducing repetitive deep knee flexion (>60-90 degrees) decreases retro-patellar contact force.",
        trigger_keywords=["patellar", "runner's knee", "anterior knee pain", "patellofemoral"],
        restriction_codes=["RESTRICT_DEEP_FLEXION"],
        disallowed_movement_tags=["deep_knee_flexion", "partial_flexion"],
        max_allowed_intensity="moderate",
    ),
    ClinicalGuidanceRule(
        rule_id="RULE_ROTATOR_CUFF_OVERHEAD_ARC",
        name="Subacromial Impingement Overhead Protection Protocol",
        target_body_area="shoulder",
        review_status="approved",
        clinical_citation="American Academy of Orthopaedic Surgeons (AAOS): Clinical Practice Guideline on the Management of Rotator Cuff Injuries (2019).",
        evidence_summary="Avoiding unguided overhead impingement arc (>90 degrees elevation/press) during acute subacromial irritation protects supraspinatus tendon.",
        trigger_keywords=["rotator cuff", "impingement", "subacromial", "shoulder pinch", "overhead pain"],
        restriction_codes=["RESTRICT_OVERHEAD"],
        disallowed_movement_tags=["overhead_press", "overhead_mobility"],
        max_allowed_intensity="gentle",
    ),
    ClinicalGuidanceRule(
        rule_id="RULE_LUMBAR_RADICULAR_FLEXION",
        name="Lumbar Radiculopathy Disc De-loading Protocol",
        target_body_area="lower_back",
        review_status="approved",
        clinical_citation="North American Spine Society (NASS): Evidence-Based Clinical Guidelines for Multidisciplinary Spine Care: Diagnosis & Treatment of Lumbar Disc Herniation with Radiculopathy (2012).",
        evidence_summary="Acute flexion-intolerant lumbar symptoms warrant restriction of end-range lumbar flexion and compressive axial loading.",
        trigger_keywords=["sciatica", "disc bulge", "lumbar radiculopathy", "flexion pain", "pinched nerve"],
        restriction_codes=["RESTRICT_SPINAL_FLEXION", "RESTRICT_AXIAL_LOAD"],
        disallowed_movement_tags=["spinal_mobility", "spinal_flexion", "axial_load", "heavy_load"],
        max_allowed_intensity="gentle",
    ),
    ClinicalGuidanceRule(
        rule_id="RULE_ACUTE_ANKLE_LIGAMENT_IMPACT",
        name="Acute Lateral Ankle Ligament Impact Protection Protocol",
        target_body_area="ankle",
        review_status="approved",
        clinical_citation="Kaminski TW, et al. National Athletic Trainers' Association Position Statement: Conservative Management and Prevention of Ankle Sprains in Athletes. J Athl Train 2013;48(4):528-545.",
        evidence_summary="Acute lateral ligament strain requires protected non-ballistic movement and avoidance of plyometric/impact loads until functional stabilization.",
        trigger_keywords=["ankle sprain", "lateral ankle", "rolled ankle", "inversion sprain"],
        restriction_codes=["RESTRICT_IMPACT"],
        disallowed_movement_tags=["impact_load", "impact_absorption"],
        max_allowed_intensity="gentle",
    ),
    ClinicalGuidanceRule(
        rule_id="RULE_HAMSTRING_ECCENTRIC_PROTECTION",
        name="Acute Hamstring Strain Eccentric Load Regulation",
        target_body_area="hamstring",
        review_status="approved",
        clinical_citation="Askling CM, et al. Acute hamstring injuries in Swedish elite football: a prospective randomised controlled clinical trial comparing two rehabilitation protocols. Br J Sports Med 2013;47:953-959.",
        evidence_summary="In early-stage hamstring strains, high-velocity unguided eccentric strain must be restricted to prevent reinjury.",
        trigger_keywords=["hamstring pull", "hamstring strain", "biceps femoris pull"],
        restriction_codes=["RESTRICT_ECCENTRIC_STRAIN"],
        disallowed_movement_tags=["eccentric_loading", "eccentric_stretch"],
        max_allowed_intensity="gentle",
    ),
    # ── Rules pending review (must NOT be applied automatically to restrict or alter care pathways) ──
    ClinicalGuidanceRule(
        rule_id="RULE_EXPERIMENTAL_CERVICAL_ISOMETRIC",
        name="Experimental High-Velocity Cervical Mobilization Protocol",
        target_body_area="neck",
        review_status="pending_review",
        clinical_citation="Pilot observational inquiry (pending formal multi-center clinical validation).",
        evidence_summary="Experimental manual protocol pending institutional physical therapy safety review.",
        trigger_keywords=["neck stiffness", "cervical strain"],
        restriction_codes=["RESTRICT_ROTATION"],
        disallowed_movement_tags=["rotational_torque"],
        max_allowed_intensity="gentle",
    ),
    ClinicalGuidanceRule(
        rule_id="RULE_EXPERIMENTAL_FASTED_PLIABILITY",
        name="Experimental Fasted Pliability Loading Protocol",
        target_body_area="knee",
        review_status="pending_review",
        clinical_citation="Preliminary hypothesis paper without clinical trial backing.",
        evidence_summary="Unverified metabolic recovery protocol not approved by sports medicine panel.",
        trigger_keywords=["tendon fatigue"],
        restriction_codes=["RESTRICT_AXIAL_LOAD"],
        disallowed_movement_tags=["axial_load"],
        max_allowed_intensity="gentle",
    ),
]


# Explicit clinical emergency keywords with citations
EMERGENCY_RED_FLAGS: list[dict[str, str]] = [
    {
        "keyword": "loss of bowel",
        "description": "Cauda equina syndrome symptom (sphincter disturbance)",
        "citation": "NICE Guideline NG59 (2016): Low back pain and sciatica",
    },
    {
        "keyword": "loss of bladder",
        "description": "Cauda equina syndrome symptom (urinary retention/incontinence)",
        "citation": "NICE Guideline NG59 (2016): Low back pain and sciatica",
    },
    {
        "keyword": "saddle anesthesia",
        "description": "Perineal sensory deficit indicating cauda equina compression",
        "citation": "NICE Guideline NG59 (2016): Low back pain and sciatica",
    },
    {
        "keyword": "numbness in groin",
        "description": "Perineal sensory deficit indicating cauda equina compression",
        "citation": "NICE Guideline NG59 (2016): Low back pain and sciatica",
    },
    {
        "keyword": "progressive motor loss",
        "description": "Acute progressive paresis or motor deficit",
        "citation": "AAOS Clinical Practice Guideline on Lumbar Radiculopathy",
    },
    {
        "keyword": "foot drop",
        "description": "Acute motor weakness of dorsiflexion",
        "citation": "AAOS Clinical Practice Guideline on Lumbar Radiculopathy",
    },
    {
        "keyword": "gross deformity",
        "description": "Structural skeletal trauma or suspected unreduced dislocation",
        "citation": "Ottawa Ankle/Knee Rules / ACSM Acute Orthopaedic Trauma Protocol",
    },
    {
        "keyword": "compound fracture",
        "description": "Open fracture or visible bone disruption",
        "citation": "ACSM Acute Orthopaedic Trauma Protocol",
    },
    {
        "keyword": "bone protruding",
        "description": "Open structural injury requiring immediate surgical evaluation",
        "citation": "ACSM Acute Orthopaedic Trauma Protocol",
    },
    {
        "keyword": "fever with joint swelling",
        "description": "Suspicion of acute septic joint arthritis",
        "citation": "British Society for Rheumatology (BSR) Guidelines for the Hot Swollen Joint",
    },
    {
        "keyword": "cold pale limb",
        "description": "Acute vascular compromise / distal perfusion deficit",
        "citation": "Vascular Society Guidelines for Acute Limb Ischemia",
    },
]

PROMPT_ASSESSMENT_INDICATORS: list[dict[str, str]] = [
    {
        "keyword": "inability to bear weight",
        "description": "Inability to bear weight immediately following trauma",
        "citation": "Stiell et al. (1992, 1996), Ottawa Ankle and Knee Rules",
        "guidance": "Prompt clinical assessment by a physician or physical therapist is advised before undertaking weight-bearing exercises.",
    },
    {
        "keyword": "cannot bear weight",
        "description": "Inability to take 4 weight-bearing steps following injury",
        "citation": "Ottawa Ankle & Knee Rules",
        "guidance": "Prompt clinical evaluation is indicated to rule out structural bone disruption.",
    },
    {
        "keyword": "joint locking",
        "description": "True mechanical intra-articular block",
        "citation": "AAOS Clinical Practice Guideline on Meniscal Tears",
        "guidance": "Prompt in-person orthopaedic assessment is indicated to evaluate meniscal or intra-articular tissue entrapment.",
    },
    {
        "keyword": "cannot fully straighten",
        "description": "Mechanical extension block",
        "citation": "AAOS Clinical Practice Guideline on Meniscal Tears",
        "guidance": "Prompt examination is indicated to rule out mechanical knee joint locking.",
    },
    {
        "keyword": "radiating down leg",
        "description": "Peripheral radicular paresthesia",
        "citation": "NASS Lumbar Radiculopathy Guideline",
        "guidance": "Prompt clinical assessment is advised to map neurological sensory distribution.",
    },
    {
        "keyword": "radiating down arm",
        "description": "Cervical radicular paresthesia",
        "citation": "AAOS Cervical Radiculopathy Guideline",
        "guidance": "Prompt clinical assessment is advised to evaluate cervical nerve root involvement.",
    },
    {
        "keyword": "rapidly worsening",
        "description": "Escalating or deteriorating symptom trajectory",
        "citation": "ACSM Guidelines for Exercise Testing and Prescription",
        "guidance": "Symptom trajectory is actively escalating; pause self-directed exercise for clinical assessment.",
    },
]


def validate_clinician_clearance(
    submission: ClinicianClearanceSubmission | None,
    current_date: date | None = None,
) -> ClearanceValidationResult:
    """
    Rigorously validate clinician clearance submissions.
    Rejects athlete self-reports and unverified credential claims.
    Enforces authorized clinician roles, valid licensing, signed declarations, and validity windows.
    """
    today = current_date or date.today()

    if submission is None:
        return ClearanceValidationResult(
            is_valid=False,
            verification_status="not_submitted",
            clinician_clearance_granted=False,
            medical_clearance_required=False,
            rejection_reasons=["No clinician clearance submission provided."],
            audit_details={"submitted": False},
        )

    # 1. Reject athlete self-reported clearance unconditionally
    if submission.attestation_type == "athlete_self_report":
        return ClearanceValidationResult(
            is_valid=False,
            verification_status="rejected_athlete_self_report",
            clinician_clearance_granted=False,
            medical_clearance_required=True,
            rejection_reasons=[
                "Athlete self-reported clearance is rejected. Medical clearance must originate "
                "from a verified clinical provider (direct clinician entry or authenticated clinical portal)."
            ],
            audit_details={
                "attestation_type": submission.attestation_type,
                "clinician_name_provided": bool(submission.clinician_name),
            },
        )

    reasons: list[str] = []

    # 2. Clinician role authorization check
    if not submission.clinician_role or submission.clinician_role not in AUTHORIZED_CLINICIAN_ROLES:
        reasons.append(
            f"Evaluating provider role '{submission.clinician_role}' is not in authorized clinical provider roles "
            f"({', '.join(sorted(AUTHORIZED_CLINICIAN_ROLES))})."
        )

    # 3. Mandatory credentials: clinician name, license number, jurisdiction
    if not submission.clinician_name or len(submission.clinician_name.strip()) < 3:
        reasons.append("Clinician legal name is missing or insufficiently specified.")

    if not submission.license_number or len(submission.license_number.strip()) < 3:
        reasons.append("Official professional license number is missing or invalid.")

    if not submission.licensing_jurisdiction or len(submission.licensing_jurisdiction.strip()) < 2:
        reasons.append("Professional licensing jurisdiction (state/board) is required.")

    # 4. Mandatory provider declaration
    if not submission.clinician_declaration_signed:
        reasons.append("Signed clinician declaration confirming active clearance was not provided.")

    # 5. Date validation (future date rejection, expiration checks)
    verification_status = "verified_authorized"

    if submission.evaluation_date:
        if submission.evaluation_date > today:
            reasons.append("Clinical evaluation date is in the future, which is clinically invalid.")
            verification_status = "rejected_future_date"
        else:
            # Check for lapse (> 60 days for acute athletic recovery clearance)
            days_since_eval = (today - submission.evaluation_date).days
            if days_since_eval > 60:
                reasons.append(
                    f"Clinical evaluation occurred {days_since_eval} days ago (clearance window has lapsed; maximum 60 days)."
                )
                verification_status = "rejected_expired"
    else:
        reasons.append("Clinical evaluation date is required to establish clearance timeline.")

    if submission.expiration_date and submission.expiration_date < today:
        reasons.append(f"Clearance expired on {submission.expiration_date}.")
        verification_status = "rejected_expired"

    if reasons:
        if verification_status not in ["rejected_future_date", "rejected_expired"]:
            if not submission.clinician_declaration_signed:
                verification_status = "rejected_missing_declaration"
            else:
                verification_status = "rejected_missing_credentials"

        return ClearanceValidationResult(
            is_valid=False,
            verification_status=verification_status,  # type: ignore[arg-type]
            clinician_clearance_granted=False,
            medical_clearance_required=True,
            rejection_reasons=reasons,
            audit_details={
                "attestation_type": submission.attestation_type,
                "role": submission.clinician_role,
                "name": submission.clinician_name,
                "license_number_provided": bool(submission.license_number),
                "declaration_signed": submission.clinician_declaration_signed,
            },
        )

    # All criteria satisfied
    return ClearanceValidationResult(
        is_valid=True,
        verification_status="verified_authorized",
        clinician_clearance_granted=True,
        medical_clearance_required=False,
        rejection_reasons=[],
        audit_details={
            "attestation_type": submission.attestation_type,
            "role": submission.clinician_role,
            "name": submission.clinician_name,
            "license": submission.license_number,
            "jurisdiction": submission.licensing_jurisdiction,
            "evaluation_date": str(submission.evaluation_date),
            "scope": submission.clearance_scope,
        },
    )


def detect_contradictions(presentation: AthleteClinicalPresentation) -> list[str]:
    """
    Detect explicit contradictions or mutually conflicting presentation data.
    """
    contradictions: list[str] = []
    text_corpus = " ".join(
        [s.lower() for s in presentation.symptoms] +
        [lim.lower() for lim in presentation.movement_limitations]
    )

    # Contradiction: Severe reported pain but claiming no symptoms or fully asymptomatic
    has_asymptomatic_claim = any(
        phrase in text_corpus for phrase in ["no symptoms", "no pain", "completely pain-free", "asymptomatic"]
    )
    if presentation.pain_severity >= 7 and has_asymptomatic_claim:
        contradictions.append(
            f"Contradiction: Severe pain rating ({presentation.pain_severity}/10) conflicts with self-reported "
            "asymptomatic/pain-free declaration."
        )

    # Contradiction: Athlete self-reporting clearance with declaration claimed
    if (
        presentation.clearance_submission is not None
        and presentation.clearance_submission.attestation_type == "athlete_self_report"
        and presentation.clearance_submission.clinician_declaration_signed
    ):
        contradictions.append(
            "Contradiction: Athlete self-report submission contains a clinician declaration signature claim. "
            "Clinician attestations must be submitted directly through verified clinical channels."
        )

    # Contradiction: Acute trauma / fracture red flags but athlete requested unrestricted activity
    has_fracture_clues = any(
        word in text_corpus for word in ["compound fracture", "gross deformity", "bone protruding"]
    )
    if (
        has_fracture_clues
        and presentation.clearance_submission is not None
        and presentation.clearance_submission.clearance_scope == "unrestricted_return_to_play"
    ):
        contradictions.append(
            "Contradiction: Active skeletal trauma keywords conflict with unrestricted return-to-play clearance scope."
        )

    return contradictions


def evaluate_triage_and_warning_signs(
    presentation: AthleteClinicalPresentation,
) -> tuple[TriageLevel, str, list[dict[str, str]], list[dict[str, str]]]:
    """
    Audit emergency and prompt medical assessment warning signs across structured screening
    and clinical symptom descriptions.
    Returns (triage_level, warning_signs_status, emergency_matches, prompt_matches).
    """
    reported_texts = [s.lower() for s in presentation.symptoms] + [
        lim.lower() for lim in presentation.movement_limitations
    ]
    all_text = " ".join(reported_texts)

    emergency_matches: list[dict[str, str]] = []
    prompt_matches: list[dict[str, str]] = []

    # 1. Structured screening inspection
    screening = presentation.warning_signs_screening
    is_screened = screening is not None and screening.screening_completed

    if is_screened and screening:
        for em in screening.emergency_signs_present:
            emergency_matches.append({
                "keyword": em,
                "description": f"Structured screening emergency flag: {em}",
                "citation": "REVORA Structured Emergency Screening Protocol",
            })
        for pm in screening.prompt_assessment_signs_present:
            prompt_matches.append({
                "keyword": pm,
                "description": f"Structured screening prompt assessment flag: {pm}",
                "citation": "REVORA Structured Clinical Screening Protocol",
            })

    # 2. Text keyword audit against evidence-based red flags
    for item in EMERGENCY_RED_FLAGS:
        if item["keyword"] in all_text:
            if not any(m["keyword"] == item["keyword"] for m in emergency_matches):
                emergency_matches.append(item)

    for item in PROMPT_ASSESSMENT_INDICATORS:
        if item["keyword"] in all_text:
            if not any(m["keyword"] == item["keyword"] for m in prompt_matches):
                prompt_matches.append(item)

    # Triage decision hierarchy
    if emergency_matches:
        return "emergency", "emergency_detected", emergency_matches, prompt_matches

    if prompt_matches:
        return "prompt_medical_assessment", "prompt_assessment_required", emergency_matches, prompt_matches

    if not is_screened:
        return "standard_monitoring", "unassessed_incomplete_data", [], []

    return "standard_monitoring", "cleared", [], []


def match_guidance_rules(
    presentation: AthleteClinicalPresentation,
) -> tuple[list[ClinicalGuidanceRule], list[ClinicalGuidanceRule]]:
    """
    Match presentation against clinical guidance rules.
    Strictly separates approved rules from pending_review rules.
    Returns (applied_approved_rules, skipped_pending_rules).
    """
    applied_approved: list[ClinicalGuidanceRule] = []
    skipped_pending: list[ClinicalGuidanceRule] = []

    body_areas_lower = {b.lower().strip() for b in presentation.body_areas}
    all_text = " ".join(
        [s.lower() for s in presentation.symptoms] +
        [lim.lower() for lim in presentation.movement_limitations]
    )

    for rule in CLINICAL_GUIDANCE_RULES:
        area_matches = rule.target_body_area.lower() in body_areas_lower
        keyword_matches = any(kw.lower() in all_text for kw in rule.trigger_keywords)

        if area_matches and keyword_matches:
            if rule.review_status == "approved":
                applied_approved.append(rule)
            else:
                skipped_pending.append(rule)

    return applied_approved, skipped_pending


def evaluate_doctor_guidance(
    presentation: AthleteClinicalPresentation,
    current_date: date | None = None,
) -> GuidanceEvaluationResponse:
    """
    Comprehensive Module 2 Doctor Guidance evaluation engine.
    - Evaluates triage and red flags with emergency priority.
    - Validates clinician clearance (rejecting athlete self-reports).
    - Reuses exact restriction codes and movement tags matching Module 3.
    - Respects review status (only approved rules trigger active restrictions).
    - Maps directly to Module 3 DoctorGuidanceInput without schema divergence.
    """
    # 1. Contradiction detection
    contradictions = detect_contradictions(presentation)

    # 2. Clearance validation
    clearance_result = validate_clinician_clearance(
        presentation.clearance_submission,
        current_date=current_date,
    )

    # 3. Triage & warning signs evaluation
    triage_level, warning_signs_status, emergency_matches, prompt_matches = evaluate_triage_and_warning_signs(
        presentation
    )

    # 4. Severe pain triage (VAS >= 8) check
    # Without clinician clearance, pain >= 8 mandates prompt clinical assessment
    if presentation.pain_severity >= 8:
        if not clearance_result.clinician_clearance_granted:
            if triage_level == "standard_monitoring":
                triage_level = "prompt_medical_assessment"
                prompt_matches.append({
                    "keyword": f"severe_pain_{presentation.pain_severity}",
                    "description": f"Severe pain severity ({presentation.pain_severity}/10) without verified clinician clearance.",
                    "citation": "Clinical pain management guideline: high acute VAS requires in-person medical evaluation before loading.",
                })

    # 5. EMERGENCY PRIORITY OVERRIDE:
    # Acute emergency warning signs supersede any existing clearance!
    if triage_level == "emergency":
        if clearance_result.is_valid:
            clearance_result = ClearanceValidationResult(
                is_valid=False,
                verification_status="rejected_athlete_self_report" if presentation.clearance_submission and presentation.clearance_submission.attestation_type == "athlete_self_report" else "verified_authorized",
                clinician_clearance_granted=False,
                medical_clearance_required=True,
                rejection_reasons=[
                    "EMERGENCY OVERRIDE: Acute emergency warning signs detected. "
                    "Prior clearance is invalidated; immediate urgent medical evaluation is required."
                ],
                audit_details={
                    **clearance_result.audit_details,
                    "emergency_override": True,
                },
            )
        else:
            clearance_result.medical_clearance_required = True
            clearance_result.clinician_clearance_granted = False

    elif triage_level == "prompt_medical_assessment":
        # Prompt assessment requires medical clearance before unguided exercise loading
        if not clearance_result.clinician_clearance_granted:
            clearance_result.medical_clearance_required = True

    # 6. Guidance rules matching (Approved vs Pending Review)
    applied_rules, pending_rules = match_guidance_rules(presentation)

    # 7. Compile active restriction codes and disallowed movement tags
    active_restriction_codes: set[str] = set()
    active_disallowed_movement_tags: set[str] = set()

    for rule in applied_rules:
        active_restriction_codes.update(rule.restriction_codes)
        active_disallowed_movement_tags.update(rule.disallowed_movement_tags)

    # Include clinician-prescribed restrictions from submission if present
    for code in presentation.clinician_prescribed_restrictions:
        if code in RESTRICTION_CODE_TAG_MAP:
            active_restriction_codes.add(code)
            active_disallowed_movement_tags.update(RESTRICTION_CODE_TAG_MAP[code])

    # Also map all active restriction codes into movement tags according to standard map
    for code in active_restriction_codes:
        active_disallowed_movement_tags.update(RESTRICTION_CODE_TAG_MAP.get(code, []))

    # 8. Determine effective maximum intensity
    # Hierarchy: start unrestricted, take lowest rank from applied rules or clinician directive
    effective_rank = 99
    effective_intensity: MaxIntensity = "unrestricted"

    for rule in applied_rules:
        r_rank = INTENSITY_RANKS.get(rule.max_allowed_intensity, 99)
        if r_rank < effective_rank:
            effective_rank = r_rank
            effective_intensity = rule.max_allowed_intensity

    if presentation.clinician_max_intensity:
        c_rank = INTENSITY_RANKS.get(presentation.clinician_max_intensity, 99)
        if c_rank < effective_rank:
            effective_rank = c_rank
            effective_intensity = presentation.clinician_max_intensity

    # If severe pain is managed with verified clearance, cap intensity strictly at 'gentle'
    if presentation.pain_severity >= 8 and clearance_result.clinician_clearance_granted:
        effective_intensity = "gentle"

    # 9. Formulate clinical summary
    summary_parts: list[str] = []
    if triage_level == "emergency":
        em_descs = "; ".join([m["description"] for m in emergency_matches])
        summary_parts.append(
            f"EMERGENCY TRIAGE: {em_descs}. Exercises strictly withheld. Seek immediate emergency evaluation."
        )
    elif triage_level == "prompt_medical_assessment":
        pm_descs = "; ".join([m["description"] for m in prompt_matches])
        summary_parts.append(
            f"PROMPT ASSESSMENT REQUIRED: {pm_descs}. Formal clinical evaluation is required before loading."
        )
    else:
        summary_parts.append("Standard monitoring: Athlete cleared for tailored recovery exercises.")
        if clearance_result.clinician_clearance_granted:
            summary_parts.append(
                f"Supervised under authorized clinician clearance ({clearance_result.audit_details.get('role', 'clinician')})."
            )

    if active_restriction_codes:
        summary_parts.append(
            f"Active restrictions enforced: {', '.join(sorted(active_restriction_codes))}."
        )

    if pending_rules:
        summary_parts.append(
            f"{len(pending_rules)} experimental rule(s) skipped pending institutional sports medicine panel review."
        )

    if warning_signs_status == "unassessed_incomplete_data":
        summary_parts.append(
            "Note: Warning signs screening was not performed; red flags cannot be verified as negative."
        )

    clinical_summary = " ".join(summary_parts)

    # 10. Construct Module 3 DoctorGuidanceInput contract
    # If emergency or prompt assessment is active, medical_clearance_required must be True,
    # and clinician_clearance_granted must be False.
    module3_guidance = DoctorGuidanceInput(
        restriction_codes=sorted(list(active_restriction_codes)),
        disallowed_movement_tags=sorted(list(active_disallowed_movement_tags)),
        medical_clearance_required=(
            triage_level in ["emergency", "prompt_medical_assessment"]
            or clearance_result.medical_clearance_required
        ),
        clinician_clearance_granted=(
            clearance_result.clinician_clearance_granted
            and triage_level == "standard_monitoring"
        ),
        max_allowed_intensity=effective_intensity,
        clinical_notes=clinical_summary,
    )

    return GuidanceEvaluationResponse(
        triage_level=triage_level,
        warning_signs_status=warning_signs_status,  # type: ignore[arg-type]
        clearance_validation=clearance_result,
        contradictions_detected=contradictions,
        active_restriction_codes=sorted(list(active_restriction_codes)),
        active_disallowed_movement_tags=sorted(list(active_disallowed_movement_tags)),
        effective_max_intensity=effective_intensity,
        applied_guidance_rules=[
            GuidanceRuleSchema(
                rule_id=r.rule_id,
                name=r.name,
                target_body_area=r.target_body_area,
                review_status=r.review_status,
                clinical_citation=r.clinical_citation,
                evidence_summary=r.evidence_summary,
                restriction_codes=r.restriction_codes,
                disallowed_movement_tags=r.disallowed_movement_tags,
                max_allowed_intensity=r.max_allowed_intensity,
            )
            for r in applied_rules
        ],
        pending_review_rules_skipped=[
            GuidanceRuleSchema(
                rule_id=r.rule_id,
                name=r.name,
                target_body_area=r.target_body_area,
                review_status=r.review_status,
                clinical_citation=r.clinical_citation,
                evidence_summary=r.evidence_summary,
                restriction_codes=r.restriction_codes,
                disallowed_movement_tags=r.disallowed_movement_tags,
                max_allowed_intensity=r.max_allowed_intensity,
            )
            for r in pending_rules
        ],
        module3_doctor_guidance=module3_guidance,
        clinical_summary=clinical_summary,
    )


def get_all_guidance_rules(approved_only: bool = False) -> list[GuidanceRuleSchema]:
    """Return all clinical guidance rules in the registry."""
    rules = [
        GuidanceRuleSchema(
            rule_id=r.rule_id,
            name=r.name,
            target_body_area=r.target_body_area,
            review_status=r.review_status,
            clinical_citation=r.clinical_citation,
            evidence_summary=r.evidence_summary,
            restriction_codes=r.restriction_codes,
            disallowed_movement_tags=r.disallowed_movement_tags,
            max_allowed_intensity=r.max_allowed_intensity,
        )
        for r in CLINICAL_GUIDANCE_RULES
    ]
    if approved_only:
        return [r for r in rules if r.review_status == "approved"]
    return rules


def get_restriction_code_catalog() -> list[dict[str, Any]]:
    """Return catalog of standardized restriction codes and mapped movement tags."""
    return [
        {
            "code": code,
            "disallowed_movement_tags": tags,
        }
        for code, tags in RESTRICTION_CODE_TAG_MAP.items()
    ]
