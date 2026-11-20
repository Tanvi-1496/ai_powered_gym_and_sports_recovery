"""Safe database connectivity test for REVORA backend.

Verifies connectivity without logging passwords, tokens, or secret URIs.
"""

from typing import Tuple, Dict, Any
from sqlalchemy import create_engine, text, inspect
from app.core.config import settings


def test_database_connection(custom_url: str | None = None) -> Tuple[bool, str, Dict[str, Any]]:
    """Test connection to the database.
    
    Returns:
        (success: bool, sanitized_message: str, details: dict)
    """
    db_url = custom_url or settings.DATABASE_URL
    
    # Determine dialect safely without exposing credentials
    is_sqlite = db_url.startswith("sqlite")
    dialect_type = "SQLite" if is_sqlite else "PostgreSQL"
    
    engine_kwargs: dict[str, Any] = {}
    if is_sqlite:
        engine_kwargs["connect_args"] = {"check_same_thread": False}
    else:
        engine_kwargs["pool_pre_ping"] = True
    
    engine = None
    try:
        engine = create_engine(db_url, **engine_kwargs)
        with engine.connect() as conn:
            # Execute simple query
            result = conn.execute(text("SELECT 1")).scalar()
            if result != 1:
                return False, f"Unexpected ping result from {dialect_type}", {}
            
            # Check version
            if is_sqlite:
                version = conn.execute(text("SELECT sqlite_version()")).scalar()
            else:
                version = conn.execute(text("SELECT version()")).scalar()
            
            # Inspect tables in the database
            inspector = inspect(conn)
            table_names = inspector.get_table_names()
            
            details = {
                "dialect": dialect_type,
                "version": str(version).split(",")[0] if version else "unknown",
                "tables_found": table_names,
                "has_recovery_checkins": "recovery_checkins" in table_names,
                "has_profiles": "profiles" in table_names,
                "has_assessments": "assessments" in table_names,
            }
            
            return True, f"Successfully connected to {dialect_type} database.", details

    except Exception as e:
        # Sanitize error message to prevent secret leaking
        err_str = str(e)
        # Strip out any potential user:password parts if present in raw error
        sanitized_err = err_str
        if "@" in sanitized_err and "://" in sanitized_err:
            import re
            sanitized_err = re.sub(r"://[^@]+@", "://***:***@", sanitized_err)
        return False, f"Connection failed to {dialect_type}: {sanitized_err}", {}
    finally:
        if engine:
            engine.dispose()


if __name__ == "__main__":
    success, msg, details = test_database_connection()
    print("=" * 60)
    print("REVORA DATABASE CONNECTION TEST")
    print("=" * 60)
    print(f"Status:  {'SUCCESS' if success else 'FAILED'}")
    print(f"Message: {msg}")
    if details:
        print("Details:")
        for k, v in details.items():
            print(f"  - {k}: {v}")
    print("=" * 60)
