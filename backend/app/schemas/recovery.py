from datetime import datetime
from typing import Any, Optional, List
from pydantic import BaseModel, Field, ConfigDict


class RecoveryCheckinCreate(BaseModel):
    sleep_hours: float = Field(ge=0, le=24)
    resting_heart_rate: int = Field(ge=25, le=240)
    hrv_ms: float | None = Field(default=None, ge=0, le=500)
    soreness: int = Field(ge=1, le=10)
    energy_level: int = Field(ge=1, le=10)


class RecoveryScoreResponse(BaseModel):
    recovery_score: float
    score: float
    score_tier: str
    tier: str
    headline: str
    summary: str
    observed_features_count: int
    imputed_features_count: int
    contributing_factors: List[str]
    observed_metrics: dict[str, Any]
    disclaimer: str



class RecoveryCheckinResponse(RecoveryCheckinCreate):
    id: int
    user_id: str | None = None
    created_at: datetime
    prediction: Optional[RecoveryScoreResponse] = None

    model_config = ConfigDict(from_attributes=True)


class RecoveryActivitySchema(BaseModel):
    id: str
    name: str
    description: str
    targetArea: str
    duration: Optional[str] = None
    sets: Optional[int] = None
    repetitions: Optional[int] = None
    frequency: Optional[str] = None
    difficulty: str
    completed: bool = False
    safetyNote: Optional[str] = None


class RecoveryPhaseSchema(BaseModel):
    id: str
    phaseNumber: int
    name: str
    title: str
    subtitle: str
    status: str
    duration: str
    summary: str
    activities: List[RecoveryActivitySchema]


class RecoveryPlanResponse(BaseModel):
    id: str
    user_id: str
    status: str
    currentPhaseNumber: int
    totalPhases: int
    overallProgressPct: int
    estimatedDuration: str
    primarySport: str
    targetAreas: List[str]
    phases: List[RecoveryPhaseSchema]
    safetyGuidelines: List[str]
    recoveryScore: Optional[float] = None
    readinessTier: Optional[str] = None
    disclaimer: str
