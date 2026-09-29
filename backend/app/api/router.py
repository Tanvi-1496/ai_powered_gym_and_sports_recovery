from fastapi import APIRouter

from app.api.routes import health, recovery

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