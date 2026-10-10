"""Supabase JWT authentication and user context resolution.

Extracts and validates Supabase Auth tokens passed via Bearer Authorization header.
Enforces strict cryptographic signature and token validation.
"""

from typing import Annotated, Optional, Dict, Any
import jwt
import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.config import settings

# HTTPBearer security scheme
security = HTTPBearer(auto_error=False)


class AuthenticatedUser:
    """Represents an authenticated Supabase athlete/user."""

    def __init__(self, user_id: str, email: Optional[str] = None, role: str = "authenticated"):
        self.id = str(user_id)
        self.email = email
        self.role = role

    def __repr__(self) -> str:
        return f"<AuthenticatedUser id={self.id} email={self.email}>"


def verify_supabase_token(token: str) -> Dict[str, Any]:
    """Verify Supabase access token with strict signature validation.

    1. If no verification mechanism (SUPABASE_JWT_SECRET or SUPABASE_URL) is configured,
       returns HTTP 500 configuration error.
    2. If token is missing, malformed, expired, unsigned, or has invalid signature, returns HTTP 401.
    3. If SUPABASE_JWT_SECRET is configured, verifies cryptographic signature
       for supported algorithms (HS256, HS384, HS512).
    4. If token uses asymmetric signing or local secret is not configured / fails,
       and SUPABASE_URL is configured, verifies token via Supabase Auth /auth/v1/user endpoint.
    5. If verification service is unreachable or returns server error, returns HTTP 503.
    """
    if not token or not isinstance(token, str) or not token.strip():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token is missing or empty.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Step 0: Ensure authentication service configuration is present
    if not settings.SUPABASE_JWT_SECRET and not settings.SUPABASE_URL:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Authentication service configuration is missing.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    clean_token = token.strip()

    # Step 1: Parse and validate JWT header structure
    try:
        unverified_header = jwt.get_unverified_header(clean_token)
    except jwt.PyJWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Malformed authorization token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed authorization token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    alg = unverified_header.get("alg", "")
    if alg == "none" or not alg:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unsigned tokens are not permitted.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Step 2: Local cryptographic verification if secret is configured and algorithm is symmetric
    if settings.SUPABASE_JWT_SECRET and alg in ["HS256", "HS384", "HS512"]:
        try:
            payload = jwt.decode(
                clean_token,
                settings.SUPABASE_JWT_SECRET,
                algorithms=["HS256", "HS384", "HS512"],
                options={"verify_signature": True, "verify_exp": True, "verify_aud": False},
            )
            return payload
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired. Please log in again.",
                headers={"WWW-Authenticate": "Bearer"},
            )
        except jwt.InvalidSignatureError:
            # If remote Supabase verification is not configured, reject immediately
            if not settings.SUPABASE_URL:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token signature.",
                    headers={"WWW-Authenticate": "Bearer"},
                )
        except jwt.PyJWTError as e:
            if not settings.SUPABASE_URL:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail=f"Invalid authentication token: {str(e)}",
                    headers={"WWW-Authenticate": "Bearer"},
                )

    # Step 3: Remote Supabase Auth API verification
    if settings.SUPABASE_URL:
        supabase_url = settings.SUPABASE_URL.rstrip("/")
        headers = {
            "Authorization": f"Bearer {clean_token}",
            "apikey": settings.SUPABASE_ANON_KEY or "",
        }
        try:
            with httpx.Client(timeout=5.0) as client:
                res = client.get(f"{supabase_url}/auth/v1/user", headers=headers)
                if res.status_code == 200:
                    user_data = res.json()
                    user_id = user_data.get("id")
                    if not user_id:
                        raise HTTPException(
                            status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Supabase user record missing identifier.",
                            headers={"WWW-Authenticate": "Bearer"},
                        )
                    return {
                        "sub": user_id,
                        "email": user_data.get("email"),
                        "role": user_data.get("role", "authenticated"),
                        "user_metadata": user_data.get("user_metadata", {}),
                        "app_metadata": user_data.get("app_metadata", {}),
                    }
                elif res.status_code in (400, 401, 403):
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Invalid or expired Supabase token.",
                        headers={"WWW-Authenticate": "Bearer"},
                    )
                else:
                    raise HTTPException(
                        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                        detail="Authentication service temporarily unavailable. Please try again later.",
                        headers={"WWW-Authenticate": "Bearer"},
                    )
        except HTTPException:
            raise
        except (httpx.RequestError, httpx.TimeoutException):
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Authentication service is currently unreachable.",
                headers={"WWW-Authenticate": "Bearer"},
            )

    # Step 4: Fallback rejection for any unverified token
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or unverified authentication token.",
        headers={"WWW-Authenticate": "Bearer"},
    )


def get_current_user(
    credentials: Annotated[Optional[HTTPAuthorizationCredentials], Depends(security)]
) -> AuthenticatedUser:
    """FastAPI Dependency: Require a verified authenticated user."""
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials required. Please provide a Bearer token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    payload = verify_supabase_token(token)
    user_id = payload.get("sub") or payload.get("user_id")

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token missing user identifier (sub).",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return AuthenticatedUser(
        user_id=str(user_id),
        email=payload.get("email"),
        role=payload.get("role", "authenticated"),
    )


def get_optional_user(
    credentials: Annotated[Optional[HTTPAuthorizationCredentials], Depends(security)]
) -> Optional[AuthenticatedUser]:
    """FastAPI Dependency: Extract verified user if token is provided, else None.

    If no token is supplied, returns None.
    If a token IS supplied, it must be verified; invalid tokens will raise HTTP 401.
    """
    if not credentials or not credentials.credentials:
        return None
    return get_current_user(credentials)
