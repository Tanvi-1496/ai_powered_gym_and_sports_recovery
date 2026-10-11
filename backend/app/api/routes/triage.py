
from pathlib import Path
from typing import Any

import joblib
import pandas as pd
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field


router = APIRouter()

# These names must match the features used to train the model.
FEATURE_COLUMNS = [
    "site_id",
    "arrival_mode",
    "arrival_hour",
    "arrival_day",
    "arrival_month",
    "arrival_season",
    "shift",
    "age",
    "age_group",
    "sex",
    "language",
    "insurance_type",
    "transport_origin",
    "pain_location",
    "mental_status_triage",
    "chief_complaint_system",
    "num_prior_ed_visits_12m",
    "num_prior_admissions_12m",
    "num_active_medications",
    "num_comorbidities",
    "systolic_bp",
    "diastolic_bp",
    "mean_arterial_pressure",
    "pulse_pressure",
    "heart_rate",
    "respiratory_rate",
    "temperature_c",
    "spo2",
    "gcs_total",
    "pain_score",
    "weight_kg",
    "height_cm",
    "bmi",
    "shock_index",
    "news2_score",
]

# Resolve the model path relative to this Python file.
ARTIFACTS_DIR = Path(__file__).resolve().parents[2] / "ml_artifacts"
MODEL_PATH = ARTIFACTS_DIR / "triage_acuity_pipeline.joblib"

try:
    model = joblib.load(MODEL_PATH)
except Exception as exc:
    raise RuntimeError(
        f"Could not load triage model from {MODEL_PATH}. "
        "Check that the model file exists and dependencies are installed."
    ) from exc


class TriagePredictionRequest(BaseModel):
    # Send the feature names from FEATURE_COLUMNS as JSON fields.
    # Values can be null when a feature is unavailable.
    features: dict[str, Any] = Field(
        ...,
        description="Feature values matching the training dataset columns.",
    )


@router.post("/predict")
def predict_triage(request: TriagePredictionRequest):
    supplied_features = request.features

    # Ignore unrelated fields and fill missing features with null.
    row = {
        column: supplied_features.get(column)
        for column in FEATURE_COLUMNS
    }
    input_df = pd.DataFrame([row], columns=FEATURE_COLUMNS)

    try:
        prediction = model.predict(input_df)[0]
        result = {
            "predicted_triage_acuity": int(prediction),
            "demo_only": True,
            "message": (
                "Educational demonstration using synthetic general-triage "
                "data. This prediction is not medical advice and must not "
                "be used to assess sports injuries or decide care urgency."
            ),
        }

        if hasattr(model, "predict_proba"):
            probabilities = model.predict_proba(input_df)[0]
            result["class_probabilities"] = {
                str(label): round(float(probability), 4)
                for label, probability in zip(model.classes_, probabilities)
            }

        return result

    except Exception as exc:
        raise HTTPException(
            status_code=422,
            detail=(
                "Prediction failed. Check that feature names and values "
                "match the training dataset."
            ),
        ) from exc