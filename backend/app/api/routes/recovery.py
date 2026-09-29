from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.recovery import RecoveryCheckin
from app.schemas.recovery import (
    RecoveryCheckinCreate,
    RecoveryCheckinResponse,
)

router = APIRouter()


@router.post(
    "/checkins",
    response_model=RecoveryCheckinResponse,
    status_code=201,
)
def create_checkin(
    payload: RecoveryCheckinCreate,
    db: Session = Depends(get_db),
):
    checkin = RecoveryCheckin(**payload.model_dump())

    db.add(checkin)
    db.commit()
    db.refresh(checkin)

    return checkin


@router.get(
    "/checkins",
    response_model=list[RecoveryCheckinResponse],
)
def list_checkins(db: Session = Depends(get_db)):
    return (
        db.query(RecoveryCheckin)
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
):
    checkin = db.get(RecoveryCheckin, checkin_id)

    if checkin is None:
        raise HTTPException(
            status_code=404,
            detail="Recovery check-in not found",
        )

    return checkin