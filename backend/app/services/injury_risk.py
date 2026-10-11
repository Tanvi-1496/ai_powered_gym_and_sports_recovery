"""Biomechanical Injury Risk Assessment Service for REVORA.

Evaluates athlete assessment data, movement limitations, and workload strain
while maintaining strict separation from the physiological ExtraTrees Recovery Score model.

Clinical Honesty & Limitations Notice:
- The trained ML model in `ml/models/` (ExtraTreesRegressor) evaluates physiological recovery readiness (`Recovery_Score`).
- In that pipeline, `Injury_Occurred` was explicitly excluded as a modeling feature.
- This service does NOT fabricate clinical diagnoses, false accuracy claims, or synthetic probabilities.
- All assessments are educational biomechanical strain evaluations grounded in reported athlete telemetry.
"""

from pathlib import Path
import time
from typing import Any, Dict, List, Optional
import joblib

from app.schemas.injury_risk import (
    InjuryRiskAssessmentRequest,
    BiomechanicalRiskPredictionResponse,
    ContributingFactor,
    InjuryRiskModelInfoResponse,
)

# Paths to ML directory
BACKEND_DIR = Path(__file__).resolve().parents[2]
WORKSPACE_ROOT = BACKEND_DIR.parent
ML_MODELS_DIR = WORKSPACE_ROOT / "ml" / "models"
INJURY_MODEL_PATH = ML_MODELS_DIR / "injury_risk_model.joblib"
RECOVERY_MODEL_PATH = ML_MODELS_DIR / "recovery_score_extra_trees.joblib"
RECOVERY_CONFIG_PATH = ML_MODELS_DIR / "recovery_model_config.json"


def check_trained_classifier_available() -> bool:
    """Check if a dedicated trained injury classification model artifact exists on disk."""
    return INJURY_MODEL_PATH.exists()


def get_model_info() -> InjuryRiskModelInfoResponse:
    """Return transparent metadata regarding trained ML models and dataset limitations."""
    return InjuryRiskModelInfoResponse(
        engine_name="REVORA Biomechanical Strain & Recovery Evaluator",
        model_version="1.0.0",
        model_type="Rule-Based Biomechanical Strain Triage (Trained ExtraTreesRegressor in ml/models/ evaluates physiological Recovery_Score)",
        target_metric="Biomechanical Strain Triage (Rule-grounded) / Recovery_Score (ExtraTrees ML: 0-100)",
        trained_artifacts_available=RECOVERY_MODEL_PATH.exists(),
        feature_count=42,
        training_dataset_description=(
            "Multimodal sports dataset merging daily physiological telemetry (D1) and sports session biomechanics (D3). "
            "Data was synthesized/augmented for regression modeling of athlete recovery readiness."
        ),
        evaluation_metrics={
            "recovery_score_mae": 8.038,
            "recovery_score_rmse": 10.065,
            "recovery_score_r2": 0.779,
        },
        clinical_validation_status=(
            "Non-clinical research split. Automated model evaluation does NOT constitute formal clinical validation. "
            "Models are not approved as medical diagnostic devices."
        ),
        limitations=[
            "Trained pipeline targets physiological Recovery_Score; injury occurrence is not modeled as a clinical diagnostic probability.",
            "Synthetic and augmented datasets contain inherent distributional shifts from diverse real-world athletic populations.",
            "Assessments reflect self-reported acute subjective pain, duration, and movement limitations rather than medical imaging.",
        ],
    )


def evaluate_biomechanical_risk(
    assessment: InjuryRiskAssessmentRequest,
) -> BiomechanicalRiskPredictionResponse:
    """
    Evaluate biomechanical injury strain based on athlete assessment data.

    Preserves strict separation between:
    1. Recovery Score (continuous autonomic & physiological telemetry readiness).
    2. Biomechanical Risk (anatomical strain, pain severity, and movement restrictions).
    """
    start_time = time.time()

    body_areas = assessment.body_areas or []
    pain = assessment.pain_severity if assessment.pain_severity is not None else 3
    duration = assessment.duration or "1-3_days"
    limitations = list(assessment.movement_limitations)
    if assessment.movement_limitation and assessment.movement_limitation not in limitations:
        limitations.append(assessment.movement_limitation)

    symptoms = list(assessment.symptoms)
    if assessment.custom_symptom:
        symptoms.append(assessment.custom_symptom)

    # 1. Identify primary anatomical strain region
    primary_area = body_areas[0].replace("_", " ").title() if body_areas else "General Kinetic Chain"

    # 2. Extract legitimate contributing biomechanical factors from athlete submission
    factors: List[ContributingFactor] = []

    # Factor: Pain severity
    if pain >= 8:
        factors.append(
            ContributingFactor(
                id="cf_pain_severe",
                name=f"Severe localized pain ({pain}/10)",
                category="symptom_pattern",
                weight=0.90,
                impactLevel="high",
                summary="Pain severity >= 8 indicates significant tissue distress requiring medical caution.",
            )
        )
    elif pain >= 5:
        factors.append(
            ContributingFactor(
                id="cf_pain_moderate",
                name=f"Moderate localized pain ({pain}/10)",
                category="symptom_pattern",
                weight=0.60,
                impactLevel="moderate",
                summary="Moderate discomfort reflects active tissue inflammation or mechanical overload.",
            )
        )
    else:
        factors.append(
            ContributingFactor(
                id="cf_pain_mild",
                name=f"Mild discomfort ({pain}/10)",
                category="symptom_pattern",
                weight=0.25,
                impactLevel="low",
                summary="Mild pain suggests low acute structural strain.",
            )
        )

    # Factor: Movement limitations
    if limitations:
        for idx, lim in enumerate(limitations[:3]):
            lim_clean = str(lim).replace("_", " ").strip()
            factors.append(
                ContributingFactor(
                    id=f"cf_lim_{idx}",
                    name=f"Movement restriction: {lim_clean}",
                    category="biomechanical",
                    weight=0.75,
                    impactLevel="moderate" if pain < 7 else "high",
                    summary=f"Functional limitation '{lim_clean}' restricts normal joint range of motion.",
                )
            )

    # Factor: Symptom duration
    if duration in ["2+_weeks", "1-2_weeks", "chronic"]:
        factors.append(
            ContributingFactor(
                id="cf_duration_persistent",
                name=f"Prolonged symptom duration ({duration.replace('_', ' ')})",
                category="symptom_pattern",
                weight=0.65,
                impactLevel="moderate",
                summary="Persistent duration suggests sub-acute or repetitive stress rather than transient fatigue.",
            )
        )

    # Factor: Workload / ACWR telemetry if supplied
    if assessment.acwr is not None:
        if assessment.acwr > 1.5:
            factors.append(
                ContributingFactor(
                    id="cf_acwr_high",
                    name=f"Elevated ACWR ratio ({assessment.acwr:.2f})",
                    category="workload",
                    weight=0.80,
                    impactLevel="high",
                    summary="Acute-to-chronic workload spike exceeding 1.5 is an established risk factor for overload injury.",
                )
            )
        elif assessment.acwr < 0.8:
            factors.append(
                ContributingFactor(
                    id="cf_acwr_low",
                    name=f"Under-prepared ACWR ({assessment.acwr:.2f})",
                    category="workload",
                    weight=0.45,
                    impactLevel="low",
                    summary="ACWR below 0.8 reflects chronic de-loading or reduced fitness baseline.",
                )
            )

    # Factor: Training intensity
    if assessment.training_intensity is not None and assessment.training_intensity >= 8:
        factors.append(
            ContributingFactor(
                id="cf_intensity_high",
                name=f"High session intensity ({assessment.training_intensity}/10)",
                category="workload",
                weight=0.70,
                impactLevel="moderate",
                summary="High intensity near symptom onset amplifies cumulative tissue shear.",
            )
        )

    # 3. Determine calibrated risk level and index
    if pain >= 8:
        risk_level = "high"
        risk_score = float(min(95, 75 + (pain - 8) * 10))
    elif pain >= 6 or (pain >= 5 and limitations):
        risk_level = "elevated"
        risk_score = float(55 + (pain - 5) * 8)
    elif pain >= 4:
        risk_level = "moderate"
        risk_score = float(35 + (pain - 3) * 8)
    else:
        risk_level = "low"
        risk_score = float(max(10, pain * 7))

    # 4. Formulate evidence-based explanation
    explanation_parts = [
        f"Biomechanical assessment indicates {risk_level} strain localized to the {primary_area.lower()}."
    ]
    if limitations:
        explanation_parts.append(
            f"Active functional restrictions ({', '.join(limitations[:2])}) elevate kinetic chain vulnerability."
        )
    if pain >= 8:
        explanation_parts.append(
            "Pain severity is in the severe category; unguided athletic loading should be paused until professional evaluation."
        )
    else:
        explanation_parts.append(
            "Conservative loading and targeted mobility within a pain-free envelope are indicated."
        )

    latency_ms = round((time.time() - start_time) * 1000, 2)

    has_dedicated_classifier = check_trained_classifier_available()
    status_code = "completed"

    model_metadata = {
        "engineName": "REVORA Biomechanical Strain & Telemetry Engine",
        "modelVersion": "1.0.0",
        "evaluationMethod": "rule_based_biomechanical_strain",
        "hasDedicatedClassifier": has_dedicated_classifier,
        "inferenceLatencyMs": latency_ms,
        "trainingDataset": "Multimodal Sports Dataset (D1+D3). ExtraTrees Recovery_Score MAE: 8.04.",
        "distinctFromRecoveryScore": True,
        "clinicalValidationNotice": (
            "Evaluation reflects biometric strain indices and programmatic guidelines; "
            "it is distinct from physiological recovery readiness and does NOT constitute a clinical diagnosis."
        ),
    }

    return BiomechanicalRiskPredictionResponse(
        riskLevel=risk_level,
        riskScore=risk_score,
        predictedRiskArea=primary_area,
        confidence=None,  # Rule/heuristic biomechanical strain evaluation; no fabricated ML probability
        contributingFactors=factors,
        explanation=" ".join(explanation_parts),
        status=status_code,
        modelMetadata=model_metadata,
    )
