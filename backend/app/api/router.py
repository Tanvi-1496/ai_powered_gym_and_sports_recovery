from fastapi import APIRouter

from app.api.routes import exercises, guidance, health, recovery

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
    guidance.router,
    prefix="/doctor-guidance",
    tags=["Doctor Guidance"],
)

api_router.include_router(
    exercises.router,
    prefix="/exercises",
    tags=["Exercises"],
)