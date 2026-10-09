from __future__ import annotations

from pathlib import Path
from typing import Mapping, Sequence

import joblib
import pandas as pd


# Project paths
ML_DIR = Path(__file__).resolve().parents[1]
MODEL_DIR = ML_DIR / "models"

MODEL_PATH = MODEL_DIR / "recovery_score_extra_trees.joblib"
CONFIG_PATH = MODEL_DIR / "recovery_model_config.json"


def _load_config() -> dict:
    """Load the model configuration JSON."""
    import json

    if not CONFIG_PATH.exists():
        raise FileNotFoundError(f"Model config not found: {CONFIG_PATH}")

    with CONFIG_PATH.open("r", encoding="utf-8") as file:
        return json.load(file)


def load_model():
    """Load and return the trained recovery-score model."""
    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"Model file not found: {MODEL_PATH}")

    return joblib.load(MODEL_PATH)


def get_feature_columns() -> list[str]:
    """Return the exact feature columns expected by the trained model."""
    config = _load_config()

    feature_columns = config.get("feature_columns")

    if not feature_columns:
        raise KeyError(
            "The model config does not contain 'feature_columns'."
        )

    return list(feature_columns)


def prepare_input(data: Mapping | pd.DataFrame) -> pd.DataFrame:
    """
    Convert input data into the exact feature structure expected by the model.

    Extra columns are ignored.
    Missing required columns raise a clear error.
    """
    feature_columns = get_feature_columns()

    if isinstance(data, Mapping):
        df = pd.DataFrame([dict(data)])
    elif isinstance(data, pd.DataFrame):
        df = data.copy()
    else:
        raise TypeError(
            "Input must be a dictionary-like object or pandas DataFrame."
        )

    missing_columns = [
        column for column in feature_columns
        if column not in df.columns
    ]

    if missing_columns:
        raise ValueError(
            "Missing required feature columns: "
            + ", ".join(missing_columns)
        )

    # Keep only the trained feature columns and preserve their exact order.
    return df[feature_columns]


def predict_recovery_score(data: Mapping | pd.DataFrame):
    """
    Predict Recovery_Score.

    Returns:
        float for a single input record
        pandas.Series for multiple DataFrame rows
    """
    model = load_model()
    X = prepare_input(data)

    predictions = model.predict(X)

    if len(predictions) == 1:
        return float(predictions[0])

    return pd.Series(predictions, index=X.index, name="Recovery_Score")


def predict_recovery_scores(
    records: Sequence[Mapping] | pd.DataFrame,
) -> pd.Series:
    """
    Batch prediction helper.

    Always returns a pandas Series named 'Recovery_Score'.
    """
    model = load_model()
    X = prepare_input(records)

    predictions = model.predict(X)

    return pd.Series(
        predictions,
        index=X.index,
        name="Recovery_Score",
    )


if __name__ == "__main__":
    print("Recovery model module loaded successfully.")
    print(f"Model:  {MODEL_PATH}")
    print(f"Config: {CONFIG_PATH}")
    print(f"Features: {len(get_feature_columns())}")