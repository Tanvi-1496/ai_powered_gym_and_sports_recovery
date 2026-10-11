from typing import Any, List, Optional
from pydantic import BaseModel, Field


class InjuryRiskAssessmentRequest(BaseModel):
    """Assessment input data used for evaluating biomechanical injury strain and risk."""
    body_areas: List[str] = Field(default_factory=list, description="Target anatomical areas reported by the athlete")
    symptoms: List[str] = Field(default_factory=list, description="Reported symptoms or discomfort patterns")
    custom_symptom: Optional[str] = Field(default=None, description="Free-text custom symptom description")
    pain_severity: Optional[int] = Field(default=None, ge=0, le=10, description="Numerical pain scale 0-10")
    duration: Optional[str] = Field(default=None, description="Symptom duration (e.g. '1-3_days', '1-2_weeks')")
    movement_limitations: List[str] = Field(default_factory=list, description="Functional movement limitations")
    movement_limitation: Optional[str] = Field(default=None, description="Single primary movement limitation string")
    activity_context: Optional[str] = Field(default=None, description="Activity context where symptoms arose")
    sport: Optional[str] = Field(default=None, description="Primary sport or athletic modality")
    training_duration_min: Optional[float] = Field(default=None, ge=0, description="Session training duration in minutes")
    training_intensity: Optional[float] = Field(default=None, ge=0, le=10, description="Training intensity 0-10")
    acwr: Optional[float] = Field(default=None, ge=0, description="Acute-to-Chronic Workload Ratio")
    fatigue_index: Optional[float] = Field(default=None, ge=0, description="Self-reported fatigue index")
    additional_details: Optional[str] = Field(default=None, description="Athlete subjective notes")


class ContributingFactor(BaseModel):
    """Contributing biomechanical, workload, or symptom pattern factor."""
    id: str
    name: str
    category: str = Field(description="'workload' | 'biomechanical' | 'symptom_pattern' | 'kinetic_chain'")
    weight: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    impactLevel: Optional[str] = Field(default=None, description="'high' | 'moderate' | 'low'")
    summary: Optional[str] = None


class BiomechanicalRiskPredictionResponse(BaseModel):
    """
    Contract representing Biomechanical Injury-Risk evaluation.
    Matches frontend BiomechanicalRiskPrediction contract in types/prediction.ts.
    """
    riskLevel: Optional[str] = Field(default=None, description="'low' | 'moderate' | 'elevated' | 'high' | None")
    riskScore: Optional[float] = Field(default=None, ge=0.0, le=100.0, description="Calibrated risk index (0-100) or None")
    predictedRiskArea: Optional[str] = Field(default=None, description="Primary anatomical area under strain")
    confidence: Optional[float] = Field(default=None, ge=0.0, le=1.0, description="Model confidence 0.0 - 1.0")
    contributingFactors: Optional[List[ContributingFactor]] = Field(default=None)
    explanation: Optional[str] = None
    status: str = Field(description="'pending_model_integration' | 'analyzing' | 'completed' | 'error'")
    modelMetadata: Optional[dict[str, Any]] = None
    clinicalDisclaimer: str = Field(
        default=(
            "REVORA biomechanical risk evaluation provides educational strain and load monitoring insights. "
            "This is NOT a clinical medical diagnosis or injury probability claim. "
            "Athletes experiencing acute pain, severe trauma, or joint instability should consult a licensed physician."
        )
    )


class InjuryRiskModelInfoResponse(BaseModel):
    """Information regarding the ML model architecture, training data, and clinical limitations."""
    engine_name: str
    model_version: str
    model_type: str
    target_metric: str
    trained_artifacts_available: bool
    feature_count: int
    training_dataset_description: str
    evaluation_metrics: dict[str, float]
    clinical_validation_status: str
    limitations: List[str]
