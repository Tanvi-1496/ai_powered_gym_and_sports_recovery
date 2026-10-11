from datetime import date
from typing import Any, Literal
from pydantic import BaseModel, Field, ConfigDict

from app.schemas.exercises import (
    DoctorGuidanceInput,
    MaxIntensity,
    TriageLevel,
    ReviewStatus,
)

AttestationType = Literal[
    "athlete_self_report",
    "direct_clinician_entry",
    "verified_clinical_portal",
    "formal_medical_document",
]

ClinicianRole = Literal[
    "sports_physician",
    "orthopedic_surgeon",
    "physiatrist",
    "physical_therapist",
    "athletic_trainer",
    "general_practitioner",
    "unverified_other",
]

ClearanceScope = Literal[
    "conservative_rehab_only",
    "modified_training",
    "unrestricted_return_to_play",
]

ClearanceVerificationStatus = Literal[
    "verified_authorized",
    "rejected_athlete_self_report",
    "rejected_missing_credentials",
    "rejected_missing_declaration",
    "rejected_expired",
    "rejected_future_date",
    "not_submitted",
]

WarningSignsStatus = Literal[
    "cleared",
    "emergency_detected",
    "prompt_assessment_required",
    "unassessed_incomplete_data",
]


class ClinicianClearanceSubmission(BaseModel):
    """
    Structured submission for clinician clearance.
    Prevents athlete self-report from granting medical clearance.
    Requires verified provider credentials and explicit declaration.
    """
    attestation_type: AttestationType = Field(
        default="athlete_self_report",
        description="Source of the clearance attestation. Athlete self-reports are strictly rejected.",
    )
    clinician_name: str | None = Field(
        default=None,
        description="Full legal name of the evaluating healthcare provider.",
    )
    license_number: str | None = Field(
        default=None,
        description="Official professional medical or physical therapy license number.",
    )
    licensing_jurisdiction: str | None = Field(
        default=None,
        description="State, province, or national licensing board jurisdiction.",
    )
    clinician_role: ClinicianRole | None = Field(
        default=None,
        description="Credentialed role of the evaluating provider.",
    )
    institution_or_clinic: str | None = Field(
        default=None,
        description="Clinical facility, hospital, or sports medicine practice name.",
    )
    evaluation_date: date | None = Field(
        default=None,
        description="Date the in-person or telehealth clinical evaluation occurred.",
    )
    expiration_date: date | None = Field(
        default=None,
        description="Optional date after which clearance is no longer valid.",
    )
    clinician_declaration_signed: bool = Field(
        default=False,
        description="Attestation statement confirmed by provider approving active recovery.",
    )
    clearance_scope: ClearanceScope = Field(
        default="conservative_rehab_only",
        description="Scope of physical activity authorized by the provider.",
    )
    notes: str | None = Field(
        default=None,
        description="Clinical rationale or specific movement precautions from provider.",
    )


class ClearanceValidationResult(BaseModel):
    """
    Auditable result of clearance verification.
    """
    is_valid: bool = Field(
        ...,
        description="True ONLY if clearance satisfies all clinical authorization criteria.",
    )
    verification_status: ClearanceVerificationStatus = Field(
        ...,
        description="Detailed verification outcome code.",
    )
    clinician_clearance_granted: bool = Field(
        ...,
        description="Whether clinician clearance is active for exercise recommendation engine.",
    )
    medical_clearance_required: bool = Field(
        ...,
        description="Whether recommendations remain blocked awaiting formal clinician clearance.",
    )
    rejection_reasons: list[str] = Field(
        default_factory=list,
        description="List of specific reasons why clearance was rejected or withheld.",
    )
    audit_details: dict[str, Any] = Field(
        default_factory=dict,
        description="Structured audit log of validation checks performed.",
    )


class WarningSignsScreening(BaseModel):
    """
    Explicit screening for clinical red flags and warning signs.
    Absence of screening data is treated as unassessed rather than negative.
    """
    screening_completed: bool = Field(
        default=False,
        description="Explicit flag indicating whether standard red-flag screening was administered.",
    )
    emergency_signs_present: list[str] = Field(
        default_factory=list,
        description="List of detected emergency warning sign indicators.",
    )
    prompt_assessment_signs_present: list[str] = Field(
        default_factory=list,
        description="List of detected non-emergency prompt medical assessment indicators.",
    )
    symptom_notes: str | None = Field(
        default=None,
        description="Contextual clinical observations or patient remarks.",
    )


class AthleteClinicalPresentation(BaseModel):
    """
    Athlete triage input presentation for Module 2 evaluation.
    """
    body_areas: list[str] = Field(
        ...,
        min_length=1,
        description="Target anatomical areas (e.g. ['knee', 'shoulder']).",
    )
    pain_severity: int = Field(
        ...,
        ge=0,
        le=10,
        description="Numeric rating scale / VAS pain score (0 to 10).",
    )
    symptoms: list[str] = Field(
        default_factory=list,
        description="Reported symptoms or sensation descriptions.",
    )
    duration: str | None = Field(
        default=None,
        description="Duration category of the symptom episode.",
    )
    movement_limitations: list[str] = Field(
        default_factory=list,
        description="Reported functional mobility restrictions.",
    )
    warning_signs_screening: WarningSignsScreening | None = Field(
        default=None,
        description="Structured red flag screening questionnaire result. If omitted, flagged as unassessed.",
    )
    clearance_submission: ClinicianClearanceSubmission | None = Field(
        default=None,
        description="Optional clinician clearance submission payload.",
    )
    clinician_prescribed_restrictions: list[str] = Field(
        default_factory=list,
        description="Standardized restriction codes explicitly mandated by supervising clinician.",
    )
    clinician_max_intensity: MaxIntensity | None = Field(
        default=None,
        description="Clinician-specified maximum intensity ceiling.",
    )


class GuidanceRuleSchema(BaseModel):
    """
    Auditable representation of a clinical guidance rule.
    """
    rule_id: str
    name: str
    target_body_area: str
    review_status: ReviewStatus = "approved"
    clinical_citation: str
    evidence_summary: str
    restriction_codes: list[str] = Field(default_factory=list)
    disallowed_movement_tags: list[str] = Field(default_factory=list)
    max_allowed_intensity: MaxIntensity = "unrestricted"

    model_config = ConfigDict(from_attributes=True)


class GuidanceEvaluationResponse(BaseModel):
    """
    Comprehensive output of Module 2 Doctor Guidance evaluation.
    Includes the exact DoctorGuidanceInput contract for Module 3 consumption.
    """
    triage_level: TriageLevel = "standard_monitoring"
    warning_signs_status: WarningSignsStatus = "cleared"
    clearance_validation: ClearanceValidationResult
    contradictions_detected: list[str] = Field(default_factory=list)
    active_restriction_codes: list[str] = Field(default_factory=list)
    active_disallowed_movement_tags: list[str] = Field(default_factory=list)
    effective_max_intensity: MaxIntensity = "unrestricted"
    applied_guidance_rules: list[GuidanceRuleSchema] = Field(default_factory=list)
    pending_review_rules_skipped: list[GuidanceRuleSchema] = Field(default_factory=list)
    module3_doctor_guidance: DoctorGuidanceInput
    clinical_summary: str
    clinical_validation_notice: str = (
        "REVORA software evaluation results reflect programmatic rules and do NOT constitute "
        "formal institutional clinical validation. All unreviewed rules remain pending review "
        "by a qualified sports physician or physiotherapist. Immediate emergency evaluation is "
        "required for any acute trauma, progressive neuro deficits, or cauda equina signs."
    )
