from typing import Any
from fastapi import APIRouter

from app.schemas.injury_risk import (
    InjuryRiskAssessmentRequest,
    BiomechanicalRiskPredictionResponse,
    InjuryRiskModelInfoResponse,
)
from app.services.injury_risk import (
    evaluate_biomechanical_risk,
    get_model_info,
)

router = APIRouter()


@router.post(
    "/predict",
    response_model=BiomechanicalRiskPredictionResponse,
    summary="Predict biomechanical injury risk and contributing factors",
    description=(
        "Evaluates athlete assessment telemetry, localized pain rating, duration, and movement limitations. "
        "Produces calibrated biomechanical strain metrics and distinct contributing factors without conflating "
        "with physiological recovery readiness."
    ),
)
def predict_injury_risk(
    payload: InjuryRiskAssessmentRequest,
) -> BiomechanicalRiskPredictionResponse:
    return evaluate_biomechanical_risk(payload)


@router.get(
    "/model-info",
    response_model=InjuryRiskModelInfoResponse,
    summary="Retrieve ML model architecture and training dataset metadata",
    description="Returns transparent details on trained model features, evaluation metrics, and non-clinical limitations.",
)
def model_info() -> InjuryRiskModelInfoResponse:
    return get_model_info()


@router.get(
    "/health",
    summary="Injury risk service health check",
    description="Returns operational status of the injury risk evaluation engine.",
)
def injury_risk_health() -> dict[str, Any]:
    return {
        "status": "healthy",
        "service": "injury-risk",
        "dedicated_classifier_available": False,
        "recovery_model_available": True,
    }
