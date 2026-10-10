import time
import jwt
import httpx
import pytest
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from unittest.mock import patch, MagicMock

from app.core.auth import (
    verify_supabase_token,
    AuthenticatedUser,
    get_current_user,
    get_optional_user,
)
from app.core.config import settings

TEST_SECRET = "super-secret-test-key-with-at-least-64-bytes-length-for-sha512-compliance-12345"


@pytest.fixture(autouse=True)
def reset_settings():
    orig_secret = settings.SUPABASE_JWT_SECRET
    orig_url = settings.SUPABASE_URL
    orig_key = settings.SUPABASE_ANON_KEY
    settings.SUPABASE_JWT_SECRET = TEST_SECRET
    settings.SUPABASE_URL = ""
    settings.SUPABASE_ANON_KEY = ""
    yield
    settings.SUPABASE_JWT_SECRET = orig_secret
    settings.SUPABASE_URL = orig_url
    settings.SUPABASE_ANON_KEY = orig_key


def test_authenticated_user_representation():
    user = AuthenticatedUser(user_id="user-123", email="athlete@example.com", role="athlete")
    assert user.id == "user-123"
    assert user.email == "athlete@example.com"
    assert user.role == "athlete"
    assert "user-123" in repr(user)


def test_verify_valid_token_hs256():
    payload = {
        "sub": "00000000-0000-0000-0000-000000000001",
        "email": "athlete@test.com",
        "role": "authenticated",
        "aud": "authenticated",
        "exp": int(time.time()) + 3600,
    }
    token = jwt.encode(payload, TEST_SECRET, algorithm="HS256")
    decoded = verify_supabase_token(token)
    assert decoded["sub"] == "00000000-0000-0000-0000-000000000001"
    assert decoded["email"] == "athlete@test.com"


def test_verify_valid_token_hs512():
    payload = {
        "sub": "user-512",
        "email": "athlete512@test.com",
        "exp": int(time.time()) + 3600,
    }
    token = jwt.encode(payload, TEST_SECRET, algorithm="HS512")
    decoded = verify_supabase_token(token)
    assert decoded["sub"] == "user-512"


def test_verify_token_invalid_signature():
    payload = {
        "sub": "user-123",
        "email": "athlete@test.com",
        "exp": int(time.time()) + 3600,
    }
    token = jwt.encode(payload, "wrong-secret-key-that-does-not-match-at-all-123456", algorithm="HS256")
    with pytest.raises(HTTPException) as exc_info:
        verify_supabase_token(token)
    assert exc_info.value.status_code == 401
    assert "signature" in exc_info.value.detail.lower() or "invalid" in exc_info.value.detail.lower()


def test_verify_token_expired():
    payload = {
        "sub": "user-123",
        "email": "athlete@test.com",
        "exp": int(time.time()) - 3600,  # Expired 1 hour ago
    }
    token = jwt.encode(payload, TEST_SECRET, algorithm="HS256")
    with pytest.raises(HTTPException) as exc_info:
        verify_supabase_token(token)
    assert exc_info.value.status_code == 401
    assert "expired" in exc_info.value.detail.lower()


def test_verify_token_unsigned_rejected():
    payload = {
        "sub": "user-123",
        "email": "athlete@test.com",
    }
    # Unsigned token (alg=none)
    token = jwt.encode(payload, key=None, algorithm=None)
    with pytest.raises(HTTPException) as exc_info:
        verify_supabase_token(token)
    assert exc_info.value.status_code == 401


def test_verify_token_malformed():
    with pytest.raises(HTTPException) as exc_info:
        verify_supabase_token("invalid-garbage-token-string")
    assert exc_info.value.status_code == 401


def test_verify_token_empty():
    with pytest.raises(HTTPException) as exc_info:
        verify_supabase_token("   ")
    assert exc_info.value.status_code == 401


def test_verify_missing_configuration():
    settings.SUPABASE_JWT_SECRET = ""
    settings.SUPABASE_URL = ""
    with pytest.raises(HTTPException) as exc_info:
        verify_supabase_token("any.token.here")
    assert exc_info.value.status_code == 500
    assert "configuration is missing" in exc_info.value.detail.lower()


def test_remote_supabase_verification_success():
    settings.SUPABASE_JWT_SECRET = ""
    settings.SUPABASE_URL = "https://example.supabase.co"
    settings.SUPABASE_ANON_KEY = "anon-key-123"

    token = jwt.encode({"sub": "remote-user-1"}, "remote-mock-secret-key-32-chars-long!", algorithm="HS256")

    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "id": "remote-user-1",
        "email": "remote@example.com",
        "role": "authenticated",
        "user_metadata": {"full_name": "Remote Athlete"},
    }

    with patch("httpx.Client.get", return_value=mock_response):
        result = verify_supabase_token(token)
        assert result["sub"] == "remote-user-1"
        assert result["email"] == "remote@example.com"


def test_remote_supabase_verification_invalid_token():
    settings.SUPABASE_JWT_SECRET = ""
    settings.SUPABASE_URL = "https://example.supabase.co"

    token = jwt.encode({"sub": "remote-user-1"}, "remote-mock-secret-key-32-chars-long!", algorithm="HS256")

    mock_response = MagicMock()
    mock_response.status_code = 401

    with patch("httpx.Client.get", return_value=mock_response):
        with pytest.raises(HTTPException) as exc_info:
            verify_supabase_token(token)
        assert exc_info.value.status_code == 401


def test_remote_supabase_verification_service_unavailable():
    settings.SUPABASE_JWT_SECRET = ""
    settings.SUPABASE_URL = "https://example.supabase.co"

    token = jwt.encode({"sub": "remote-user-1"}, "remote-mock-secret-key-32-chars-long!", algorithm="HS256")

    with patch("httpx.Client.get", side_effect=httpx.ConnectError("Connection refused")):
        with pytest.raises(HTTPException) as exc_info:
            verify_supabase_token(token)
        assert exc_info.value.status_code == 503
        assert "unreachable" in exc_info.value.detail.lower()


def test_get_current_user_no_credentials():
    with pytest.raises(HTTPException) as exc_info:
        get_current_user(None)
    assert exc_info.value.status_code == 401


def test_get_current_user_valid_token():
    payload = {
        "sub": "user-current-1",
        "email": "current@example.com",
        "exp": int(time.time()) + 3600,
    }
    token = jwt.encode(payload, TEST_SECRET, algorithm="HS256")
    creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)
    user = get_current_user(creds)
    assert user.id == "user-current-1"
    assert user.email == "current@example.com"


def test_get_optional_user_none_when_no_token():
    user = get_optional_user(None)
    assert user is None


def test_get_optional_user_valid_token():
    payload = {
        "sub": "optional-user-1",
        "email": "optional@example.com",
        "exp": int(time.time()) + 3600,
    }
    token = jwt.encode(payload, TEST_SECRET, algorithm="HS256")
    creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)
    user = get_optional_user(creds)
    assert user is not None
    assert user.id == "optional-user-1"


def test_get_optional_user_rejects_invalid_token():
    # If a token IS provided, but invalid, get_optional_user must reject with 401 (not silently return None)
    creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials="invalid-token")
    with pytest.raises(HTTPException) as exc_info:
        get_optional_user(creds)
    assert exc_info.value.status_code == 401
