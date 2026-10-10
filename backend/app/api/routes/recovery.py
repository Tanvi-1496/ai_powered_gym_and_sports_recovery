from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.auth import AuthenticatedUser, get_current_user
from app.db.session import get_db
from app.models.recovery import RecoveryCheckin
from app.schemas.recovery import (
    RecoveryCheckinCreate,
    RecoveryCheckinResponse,
    RecoveryScoreResponse,
    RecoveryPlanResponse,
)
from app.services.ml_recovery import predict_recovery_for_checkin
from app.services.recovery import generate_personalized_recovery_plan

router = APIRouter()


@router.get(
    "/plan",
    response_model=RecoveryPlanResponse,
)
def get_recovery_plan(
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Retrieve or generate personalized 4-phase recovery plan based on athlete profile, assessment, and check-ins."""
    try:
        plan_dict = generate_personalized_recovery_plan(
            user_id=current_user.id,
            db=db,
        )
        return RecoveryPlanResponse(**plan_dict)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate recovery plan: {str(e)}",
        )



@router.post(
    "/checkins",
    response_model=RecoveryCheckinResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_checkin(
    payload: RecoveryCheckinCreate,
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    checkin_data = payload.model_dump()
    checkin_data["user_id"] = current_user.id
    checkin = RecoveryCheckin(**checkin_data)

    db.add(checkin)
    db.commit()
    db.refresh(checkin)

    # Compute ML recovery score based on athlete telemetry and history
    try:
        prediction_result = predict_recovery_for_checkin(
            user_id=current_user.id,
            sleep_hours=payload.sleep_hours,
            resting_heart_rate=payload.resting_heart_rate,
            hrv_ms=payload.hrv_ms,
            soreness=payload.soreness,
            energy_level=payload.energy_level,
            db=db,
        )
        prediction = RecoveryScoreResponse(**prediction_result)
    except Exception as e:
        print("[ML Inference Error]", e)
        prediction = None

    response = RecoveryCheckinResponse(
        id=checkin.id,
        user_id=checkin.user_id,
        sleep_hours=checkin.sleep_hours,
        resting_heart_rate=checkin.resting_heart_rate,
        hrv_ms=checkin.hrv_ms,
        soreness=checkin.soreness,
        energy_level=checkin.energy_level,
        created_at=checkin.created_at,
        prediction=prediction,
    )
    return response


@router.post(
    "/predict-score",
    response_model=RecoveryScoreResponse,
)
def predict_score(
    payload: RecoveryCheckinCreate,
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Run ExtraTrees ML inference for given recovery telemetry and athlete history."""
    try:
        prediction_dict = predict_recovery_for_checkin(
            user_id=current_user.id,
            sleep_hours=payload.sleep_hours,
            resting_heart_rate=payload.resting_heart_rate,
            hrv_ms=payload.hrv_ms,
            soreness=payload.soreness,
            energy_level=payload.energy_level,
            db=db,
        )
        return RecoveryScoreResponse(**prediction_dict)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Recovery score prediction failed: {str(e)}",
        )


@router.get(
    "/checkins",
    response_model=list[RecoveryCheckinResponse],
)
def list_checkins(
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    return (
        db.query(RecoveryCheckin)
        .filter(RecoveryCheckin.user_id == current_user.id)
        .order_by(RecoveryCheckin.created_at.desc())
        .limit(100)
        .all()
    )


@router.get(
    "/checkins/{checkin_id}",
    response_model=RecoveryCheckinResponse,
)
def get_checkin(
    checkin_id: int,
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    checkin = (
        db.query(RecoveryCheckin)
        .filter(
            RecoveryCheckin.id == checkin_id,
            RecoveryCheckin.user_id == current_user.id,
        )
        .first()
    )

    if checkin is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recovery check-in not found",
        )

    return checkin


@router.delete(
    "/checkins/{checkin_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_checkin(
    checkin_id: int,
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    checkin = (
        db.query(RecoveryCheckin)
        .filter(
            RecoveryCheckin.id == checkin_id,
            RecoveryCheckin.user_id == current_user.id,
        )
        .first()
    )

    if checkin is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recovery check-in not found",
        )

    db.delete(checkin)
    db.commit()
    return None
