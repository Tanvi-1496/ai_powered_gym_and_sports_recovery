from fastapi import APIRouter

from app.api.routes import exercises, health, recovery, triage

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
    tags=["Exercises"],
)


api_router.include_router(
    triage.router,
    prefix="/triage",
    tags=["Triage Demo"],
)