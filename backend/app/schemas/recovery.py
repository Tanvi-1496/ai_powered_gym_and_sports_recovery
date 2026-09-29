from datetime import datetime

from pydantic import BaseModel, Field, ConfigDict


class RecoveryCheckinCreate(BaseModel):
    sleep_hours: float = Field(ge=0, le=24)
    resting_heart_rate: int = Field(ge=25, le=240)
    hrv_ms: float | None = Field(default=None, ge=0, le=500)
    soreness: int = Field(ge=1, le=10)
    energy_level: int = Field(ge=1, le=10)


class RecoveryCheckinResponse(RecoveryCheckinCreate):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)