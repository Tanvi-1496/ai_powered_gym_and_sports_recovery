from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.config import settings
from app.db.session import Base, engine

# Import models so SQLAlchemy knows about their tables.
from app.models.recovery import RecoveryCheckin  # noqa: F401


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title=settings.APP_NAME,
    description="Gym and sports recovery API",
    version="1.0.0",
    lifespan=lifespan,
)

# Define local development origins while respecting configured FRONTEND_URL
allowed_origins = [
    settings.FRONTEND_URL,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
# Remove duplicates preserving order
allowed_origins = list(dict.fromkeys(allowed_origins))

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:[0-9]+)?$",
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE", "PUT", "PATCH", "OPTIONS"],
    allow_headers=["*"],
)



app.include_router(api_router)


@app.get("/")
def root():
    return {
        "message": "Welcome to RecoverAI API",
        "docs": "/docs",
    }