"""ML Recovery Score inference service for REVORA.

Integrates the trained ExtraTrees recovery score model (ml/models/recovery_score_extra_trees.joblib)
with athlete profile and historical check-in telemetry.
"""

import sys
from datetime import datetime, date, timezone, timedelta
from pathlib import Path
from typing import Dict, Any, Optional, List
import numpy as np
import pandas as pd
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.models.recovery import RecoveryCheckin

# Add workspace root to sys.path to access ml module if not present
WORKSPACE_ROOT = Path(__file__).resolve().parents[3]
if str(WORKSPACE_ROOT) not in sys.path:
    sys.path.insert(0, str(WORKSPACE_ROOT))

from ml.src.predict import load_model, get_feature_columns

# Global cached model instance
_MODEL = None


def get_model():
    """Lazy load and cache the ExtraTrees recovery score pipeline."""
    global _MODEL
    if _MODEL is None:
        _MODEL = load_model()
    return _MODEL


def calculate_age_from_dob(dob_str: Optional[str]) -> Optional[int]:
    """Calculate integer age from YYYY-MM-DD string."""
    if not dob_str:
        return None
    try:
        born = datetime.strptime(dob_str.strip(), "%Y-%m-%d").date()
        today = date.today()
        return today.year - born.year - ((today.month, today.day) < (born.month, born.day))
    except Exception:
        return None


def get_score_tier(score: float) -> str:
    """Return normalized wellness tier code for predicted Recovery_Score (0-100)."""
    if score >= 75.0:
        return "optimal"
    elif score >= 50.0:
        return "moderate"
    elif score >= 35.0:
        return "low"
    else:
        return "critical"



import uuid

def is_valid_uuid(val: str) -> bool:
    """Check whether a given string is a valid UUID."""
    try:
        uuid.UUID(str(val))
        return True
    except (ValueError, TypeError, AttributeError):
        return False


def compute_derived_features(
    user_id: str,
    sleep_hours: float,
    resting_heart_rate: int,
    hrv_ms: Optional[float],
    soreness: int,
    energy_level: int,
    db: Session,
) -> Dict[str, Any]:
    """Query legitimate historical checkins and athlete profile to build ML feature inputs."""
    feature_cols = get_feature_columns()
    input_row: Dict[str, Any] = {col: np.nan for col in feature_cols}

    # 1. Direct observed check-in values
    input_row["Sleep_Duration_Hours"] = float(sleep_hours)
    input_row["Resting_Heart_Rate"] = float(resting_heart_rate)
    if hrv_ms is not None:
        input_row["HRV_ms"] = float(hrv_ms)
    input_row["Muscle_Soreness"] = float(soreness)
    input_row["Energy_Level"] = float(energy_level)

    # 2. Historical 7-day rolling metrics from database
    seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
    past_checkins = []
    if is_valid_uuid(user_id):
        try:
            past_checkins = (
                db.query(RecoveryCheckin)
                .filter(
                    RecoveryCheckin.user_id == str(user_id),
                    RecoveryCheckin.created_at >= seven_days_ago,
                )
                .all()
            )
        except Exception as err:
            print("[compute_derived_features] Error querying past checkins:", err)
            past_checkins = []

    all_sleep = [c.sleep_hours for c in past_checkins] + [sleep_hours]
    all_rhr = [c.resting_heart_rate for c in past_checkins] + [resting_heart_rate]
    all_hrv = [c.hrv_ms for c in past_checkins if c.hrv_ms is not None]
    if hrv_ms is not None:
        all_hrv.append(hrv_ms)

    input_row["Sleep_Duration_7d_Avg"] = float(np.mean(all_sleep))
    input_row["Resting_HR_7d_Avg"] = float(np.mean(all_rhr))
    if all_hrv:
        input_row["HRV_7d_Avg"] = float(np.mean(all_hrv))

    # Sleep deficit assuming baseline 8.0 hours
    input_row["Sleep_Deficit"] = max(0.0, 8.0 - float(sleep_hours))

    # 3. Legitimate Profile Demographics
    if is_valid_uuid(user_id):
        try:
            profile_res = db.execute(
                text("SELECT date_of_birth, gender, primary_sport, custom_sport FROM public.profiles WHERE id = :uid"),
                {"uid": str(user_id)},
            ).fetchone()

            if profile_res:
                dob, gender, primary_sport, custom_sport = profile_res
                age = calculate_age_from_dob(dob)
                if age is not None:
                    input_row["Age"] = float(age)

                if gender:
                    # Normalize gender string
                    g_lower = str(gender).strip().lower()
                    if "female" in g_lower:
                        input_row["Gender"] = "Female"
                    elif "male" in g_lower:
                        input_row["Gender"] = "Male"
                    else:
                        input_row["Gender"] = "Non-binary"

                sport = custom_sport if (primary_sport == "other" and custom_sport) else primary_sport
                if sport:
                    input_row["Sport_Type"] = str(sport).strip().title()
        except Exception:
            # If public.profiles table query is not available, proceed safely
            pass

    return input_row



def predict_recovery_for_checkin(
    user_id: str,
    sleep_hours: float,
    resting_heart_rate: int,
    hrv_ms: Optional[float],
    soreness: int,
    energy_level: int,
    db: Session,
) -> Dict[str, Any]:
    """Run ML ExtraTrees inference and return recovery score with structured breakdown."""
    model = get_model()
    feature_cols = get_feature_columns()

    # Build input with legitimate data + rolling averages
    input_dict = compute_derived_features(
        user_id=user_id,
        sleep_hours=sleep_hours,
        resting_heart_rate=resting_heart_rate,
        hrv_ms=hrv_ms,
        soreness=soreness,
        energy_level=energy_level,
        db=db,
    )

    # Convert to DataFrame ensuring column order
    df_input = pd.DataFrame([input_dict])[feature_cols]

    # Predict continuous recovery score
    raw_pred = model.predict(df_input)[0]
    score = round(float(np.clip(raw_pred, 0.0, 100.0)), 1)
    tier = get_score_tier(score)

    # Compute key physiological drivers
    factors: List[str] = []
    if sleep_hours >= 7.5:
        factors.append(f"Optimal sleep duration ({sleep_hours}h)")
    elif sleep_hours < 6.0:
        factors.append(f"Restricted sleep ({sleep_hours}h)")

    if resting_heart_rate <= 62:
        factors.append(f"Low resting heart rate ({resting_heart_rate} bpm)")
    elif resting_heart_rate >= 75:
        factors.append(f"Elevated resting heart rate ({resting_heart_rate} bpm)")

    if hrv_ms is not None:
        if hrv_ms >= 60.0:
            factors.append(f"Strong parasympathetic HRV tone ({hrv_ms} ms)")
        elif hrv_ms < 40.0:
            factors.append(f"Depressed HRV ({hrv_ms} ms)")

    if soreness <= 3:
        factors.append(f"Minimal muscle soreness ({soreness}/10)")
    elif soreness >= 7:
        factors.append(f"High localized soreness ({soreness}/10)")

    if energy_level >= 7:
        factors.append(f"High perceived energy ({energy_level}/10)")
    elif energy_level <= 4:
        factors.append(f"Low perceived energy ({energy_level}/10)")

    observed_count = sum(1 for v in input_dict.values() if not (isinstance(v, float) and np.isnan(v)))
    imputed_count = len(feature_cols) - observed_count

    headline = (
        "Optimal Physiological Recovery" if score >= 75.0
        else "Moderate Readiness & Load Tolerance" if score >= 50.0
        else "High Fatigue — Active Rest Advised"
    )
    summary = (
        "Your biometric telemetry indicates excellent recovery capacity." if score >= 75.0
        else "Your physiological indicators reflect moderate recovery with baseline readiness." if score >= 50.0
        else "Elevated fatigue or soreness metrics suggest prioritizing active recovery and sleep."
    )

    return {
        "recovery_score": score,
        "score": score,
        "score_tier": tier,
        "tier": tier,
        "headline": headline,
        "summary": summary,
        "observed_features_count": observed_count,
        "imputed_features_count": imputed_count,
        "contributing_factors": factors,
        "observed_metrics": {
            "sleep_hours": sleep_hours,
            "resting_heart_rate": resting_heart_rate,
            "hrv_ms": hrv_ms,
            "soreness": soreness,
            "energy_level": energy_level,
            "sleep_7d_avg": round(float(input_dict.get("Sleep_Duration_7d_Avg", sleep_hours)), 1),
            "resting_hr_7d_avg": round(float(input_dict.get("Resting_HR_7d_Avg", resting_heart_rate)), 1),
        },
        "disclaimer": (
            "Experimental wellness estimate derived from trained physiological telemetry models. "
            "This score is not a clinical medical diagnosis or injury risk prediction."
        ),
    }
