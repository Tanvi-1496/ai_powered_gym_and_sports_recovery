from typing import Literal
from pydantic import BaseModel, Field, ConfigDict

ActivityDifficulty = Literal["gentle", "moderate", "advanced"]
MaxIntensity = Literal["gentle", "moderate", "advanced", "unrestricted"]
RecommendationStatus = Literal[
    "recommended",
    "conservative_guidance",
    "withheld",
    "no_match",
]


class DoctorGuidanceInput(BaseModel):
    """
    Structured safety input contract from Module 2 (Doctor Guidance).
    Uses structured codes and movement tags instead of relying purely on free-text parsing.
    """
    restriction_codes: list[str] = Field(
        default_factory=list,
        description="Standardized restriction codes (e.g., 'RESTRICT_DEEP_FLEXION', 'RESTRICT_OVERHEAD').",
    )
    disallowed_movement_tags: list[str] = Field(
        default_factory=list,
        description="Specific movement tags that must be excluded (e.g., 'deep_knee_flexion', 'overhead_mobility').",
    )
    medical_clearance_required: bool = Field(
        default=False,
        description="If True, all exercises are withheld until clinical clearance is obtained.",
    )
    max_allowed_intensity: MaxIntensity = Field(
        default="unrestricted",
        description="Ceiling intensity for exercise selection ('gentle', 'moderate', 'advanced', 'unrestricted').",
    )
    clinical_notes: str | None = Field(
        default=None,
        description="Optional clinical context notes from supervising provider.",
    )


class ExerciseAssessmentRequest(BaseModel):
    """
    Assessment input for physical recovery recommendations.
    Accepts single or multiple injury/soreness locations.
    """
    body_areas: list[str] = Field(
        ...,
        min_length=1,
        description="List of target anatomical areas (e.g., ['knee', 'lower_back']).",
    )
    symptoms: list[str] = Field(
        default_factory=list,
        description="Reported symptoms (e.g., ['sharp pain', 'stiffness', 'clicking']).",
    )
    pain_severity: int = Field(
        ...,
        ge=0,
        le=10,
        description="VAS pain rating from 0 (none) to 10 (worst imaginable).",
    )
    duration: str | None = Field(
        default=None,
        description="Symptom duration (e.g., '<1_day', '1-3_days', '4-7_days', '>2_weeks').",
    )
    movement_limitations: list[str] = Field(
        default_factory=list,
        description="Self-reported limitations (e.g., ['cannot bend knee past 90 degrees', 'limited overhead reach']).",
    )
    doctor_guidance: DoctorGuidanceInput | None = Field(
        default=None,
        description="Optional doctor-guidance restrictions and movement limitations from Module 2.",
    )


class RecoveryActivitySchema(BaseModel):
    """
    Exact data contract conforming to frontend RecoveryActivity interface in recovery.ts.
    """
    id: str
    name: str
    description: str
    targetArea: str
    duration: str | None = None
    sets: int | None = None
    repetitions: int | None = None
    frequency: str | None = None
    difficulty: ActivityDifficulty = "gentle"
    safetyNote: str | None = None
    videoThumbnailUrl: str | None = None
    verifiedSources: list[str] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class SafetyEvaluation(BaseModel):
    """
    Diagnostic safety evaluation output from the safety filter pipeline.
    """
    is_safe: bool = True
    withhold_recommendation: bool = False
    is_conservative: bool = False
    withhold_reason: str | None = None
    warnings: list[str] = Field(default_factory=list)
    excluded_exercises: list[dict[str, str]] = Field(
        default_factory=list,
        description="Audit log of exercises filtered out and why.",
    )


class ExerciseRecommendationResponse(BaseModel):
    """
    Core response contract for Module 3 recommendation engine.
    """
    status: RecommendationStatus
    activities: list[RecoveryActivitySchema] = Field(default_factory=list)
    safety_summary: str
    warnings: list[str] = Field(default_factory=list)
    target_areas: list[str] = Field(default_factory=list)
    excluded_count: int = 0
    clinical_disclaimer: str = (
        "REVORA exercise recommendations are educational and designed for active gym recovery. "
        "They do not replace formal clinical assessment, physical therapy diagnosis, or physician care. "
        "Immediately cease any exercise that produces sharp or radiating pain."
    )


class RecoveryPhaseSchema(BaseModel):
    """
    Multi-phase schedule schema matching frontend RecoveryPhase.
    """
    id: str
    phaseNumber: int
    name: str
    status: Literal["locked", "current", "completed", "pending_generation"] = "current"
    duration: str | None = None
    summary: str | None = None
    activities: list[RecoveryActivitySchema] = Field(default_factory=list)


class RecoveryPlanSchema(BaseModel):
    """
    Complete recovery plan schema matching frontend RecoveryPlan.
    """
    id: str
    status: Literal["pending_recommendation_engine", "generating", "active", "completed"] = "active"
    currentPhaseNumber: int = 1
    totalPhases: int = 2
    overallProgressPct: int | None = 0
    estimatedDuration: str | None = "1-2 weeks"
    targetAreas: list[str] = Field(default_factory=list)
    phases: list[RecoveryPhaseSchema] = Field(default_factory=list)
    safetyGuidelines: list[str] = Field(default_factory=list)
    createdAt: str | None = None
