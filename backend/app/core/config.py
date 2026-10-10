from pathlib import Path
from typing import Annotated
from pydantic import BeforeValidator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Robustly find backend/.env regardless of current working directory
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
ENV_FILE_PATHS = (
    BACKEND_DIR / ".env",
    Path.cwd() / "backend" / ".env",
    Path.cwd() / ".env",
)


def normalize_database_url(url: str | None) -> str:
    """Normalize PostgreSQL URLs for SQLAlchemy compatibility."""
    if not url or not url.strip():
        return "sqlite:///./recovery.db"

    url = url.strip()
    # Supabase / Heroku sometimes uses postgres://, SQLAlchemy requires postgresql://
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)
    return url


class Settings(BaseSettings):
    APP_NAME: str = "RecoverAI"
    DATABASE_URL: Annotated[str, BeforeValidator(normalize_database_url)] = "sqlite:///./recovery.db"
    FRONTEND_URL: str = "http://localhost:5173"

    # Supabase Auth configuration (optional for JWT verification)
    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_JWT_SECRET: str = ""
    ENVIRONMENT: str = "development"

    model_config = SettingsConfigDict(
        env_file=ENV_FILE_PATHS,
        extra="ignore",
        env_file_encoding="utf-8",
    )


settings = Settings()
