import re
from pathlib import Path
from typing import Annotated
from pydantic import AliasChoices, BeforeValidator, Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Robustly find .env files across backend, root, and frontend directories
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
WORKSPACE_ROOT = BACKEND_DIR.parent

ENV_FILE_PATHS = (
    BACKEND_DIR / ".env",
    Path.cwd() / "backend" / ".env",
    WORKSPACE_ROOT / ".env",
    Path.cwd() / ".env",
    WORKSPACE_ROOT / "frontend" / ".env.local",
    Path.cwd() / "frontend" / ".env.local",
    WORKSPACE_ROOT / "frontend" / ".env",
    Path.cwd() / "frontend" / ".env",
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

    # Supabase Auth configuration (supports both backend and frontend VITE_ aliases)
    SUPABASE_URL: str = Field(
        default="",
        validation_alias=AliasChoices("SUPABASE_URL", "VITE_SUPABASE_URL"),
    )
    SUPABASE_ANON_KEY: str = Field(
        default="",
        validation_alias=AliasChoices("SUPABASE_ANON_KEY", "VITE_SUPABASE_ANON_KEY"),
    )
    SUPABASE_JWT_SECRET: str = Field(
        default="",
        validation_alias=AliasChoices("SUPABASE_JWT_SECRET", "JWT_SECRET"),
    )
    ENVIRONMENT: str = "development"

    # Google Gemini API configuration
    GEMINI_API_KEY: str = Field(
        default="",
        validation_alias=AliasChoices("GEMINI_API_KEY", "GOOGLE_API_KEY"),
    )
    GEMINI_MODEL: str = Field(
        default="gemini-flash-latest",
        validation_alias=AliasChoices("GEMINI_MODEL", "GOOGLE_MODEL"),
    )

    @model_validator(mode="after")
    def infer_supabase_settings(self) -> "Settings":
        """If SUPABASE_URL is not explicitly specified, infer it from Supabase DATABASE_URL."""
        if not self.SUPABASE_URL and self.DATABASE_URL:
            # Matches postgres.<project_ref> in Supabase connection string
            match = re.search(r"postgres\.([a-zA-Z0-9_-]+)", self.DATABASE_URL)
            if match:
                ref = match.group(1)
                self.SUPABASE_URL = f"https://{ref}.supabase.co"
        return self

    model_config = SettingsConfigDict(
        env_file=ENV_FILE_PATHS,
        extra="ignore",
        env_file_encoding="utf-8",
    )


settings = Settings()
