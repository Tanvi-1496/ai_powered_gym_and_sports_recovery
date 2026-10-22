from fastapi import APIRouter

from app.api.routes import health, recovery, exercises, guidance, injury_risk, symptoms

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(
    health.router,
    tags=["Health"],
)

api_router.include_router(
    recovery.router,
    prefix="/recovery",
    tags=["Recovery"],
)

api_router.include_router(
    exercises.router,
    prefix="/exercises",
    tags=["Exercise Recommendations"],
)

api_router.include_router(
    guidance.router,
    prefix="/doctor-guidance",
    tags=["Doctor Guidance & Clinical Triage"],
)

api_router.include_router(
    injury_risk.router,
    prefix="/injury-risk",
    tags=["Injury Risk Prediction"],
)

api_router.include_router(
    symptoms.router,
    prefix="/symptoms",
    tags=["Symptom Interpretation"],
)