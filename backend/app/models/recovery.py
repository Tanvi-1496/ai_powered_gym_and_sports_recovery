from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, Integer, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class RecoveryCheckin(Base):
    __tablename__ = "recovery_checkins"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, index=True, autoincrement=True
    )
    user_id: Mapped[str | None] = mapped_column(
        Uuid(as_uuid=False), nullable=True, index=True
    )
    sleep_hours: Mapped[float] = mapped_column(Float, nullable=False)
    resting_heart_rate: Mapped[int] = mapped_column(Integer, nullable=False)
    hrv_ms: Mapped[float | None] = mapped_column(
        Float, nullable=True
    )
    soreness: Mapped[int] = mapped_column(Integer, nullable=False)
    energy_level: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
