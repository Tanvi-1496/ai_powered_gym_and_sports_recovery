from app.core.config import Settings, normalize_database_url


def test_normalize_database_url_empty():
    assert normalize_database_url(None) == "sqlite:///./recovery.db"
    assert normalize_database_url("") == "sqlite:///./recovery.db"
    assert normalize_database_url("   ") == "sqlite:///./recovery.db"


def test_normalize_database_url_postgres_prefix():
    raw_url = "postgres://user:pass@localhost:5432/db"
    normalized = normalize_database_url(raw_url)
    assert normalized == "postgresql://user:pass@localhost:5432/db"


def test_normalize_database_url_standard():
    pg_url = "postgresql://user:pass@localhost:5432/db"
    assert normalize_database_url(pg_url) == pg_url

    sqlite_url = "sqlite:///./test.db"
    assert normalize_database_url(sqlite_url) == sqlite_url


def test_settings_defaults():
    settings = Settings()
    assert settings.APP_NAME == "RecoverAI"
    assert settings.DATABASE_URL.startswith(("sqlite", "postgresql"))
