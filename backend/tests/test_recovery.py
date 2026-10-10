import jwt
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.session import Base, get_db
from app.models.recovery import RecoveryCheckin
from app.core.config import settings


# Create an in-memory SQLite database for test isolation
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

test_engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)


def make_test_token(user_id: str, email: str = "athlete@example.com") -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "role": "authenticated",
        "aud": "authenticated",
    }
    return jwt.encode(payload, "test-secret-that-is-at-least-32-bytes-long", algorithm="HS256")


@pytest.fixture(autouse=True)
def setup_db():
    settings.SUPABASE_JWT_SECRET = "test-secret-that-is-at-least-32-bytes-long"
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


def test_unauthenticated_request_rejected():
    response = client.get("/api/v1/recovery/checkins")
    assert response.status_code == 401


def test_create_and_list_checkin_scoped_to_user():
    user1_id = "11111111-1111-1111-1111-111111111111"
    token1 = make_test_token(user1_id, "user1@example.com")
    headers1 = {"Authorization": f"Bearer {token1}"}

    user2_id = "22222222-2222-2222-2222-222222222222"
    token2 = make_test_token(user2_id, "user2@example.com")
    headers2 = {"Authorization": f"Bearer {token2}"}

    # User 1 creates a check-in
    payload1 = {
        "sleep_hours": 8.0,
        "resting_heart_rate": 60,
        "hrv_ms": 65.0,
        "soreness": 3,
        "energy_level": 8,
    }
    create_res1 = client.post("/api/v1/recovery/checkins", json=payload1, headers=headers1)
    assert create_res1.status_code == 201
    created_checkin1 = create_res1.json()
    assert created_checkin1["user_id"] == user1_id
    assert created_checkin1["sleep_hours"] == 8.0

    # User 2 creates a check-in
    payload2 = {
        "sleep_hours": 6.5,
        "resting_heart_rate": 72,
        "hrv_ms": 45.0,
        "soreness": 6,
        "energy_level": 5,
    }
    create_res2 = client.post("/api/v1/recovery/checkins", json=payload2, headers=headers2)
    assert create_res2.status_code == 201
    created_checkin2 = create_res2.json()
    assert created_checkin2["user_id"] == user2_id

    # User 1 lists check-ins -> should ONLY see User 1's checkin
    list_res1 = client.get("/api/v1/recovery/checkins", headers=headers1)
    assert list_res1.status_code == 200
    items1 = list_res1.json()
    assert len(items1) == 1
    assert items1[0]["id"] == created_checkin1["id"]
    assert items1[0]["user_id"] == user1_id

    # User 2 lists check-ins -> should ONLY see User 2's checkin
    list_res2 = client.get("/api/v1/recovery/checkins", headers=headers2)
    assert list_res2.status_code == 200
    items2 = list_res2.json()
    assert len(items2) == 1
    assert items2[0]["id"] == created_checkin2["id"]
    assert items2[0]["user_id"] == user2_id


def test_cross_user_access_blocked():
    user1_id = "11111111-1111-1111-1111-111111111111"
    token1 = make_test_token(user1_id)
    headers1 = {"Authorization": f"Bearer {token1}"}

    user2_id = "22222222-2222-2222-2222-222222222222"
    token2 = make_test_token(user2_id)
    headers2 = {"Authorization": f"Bearer {token2}"}

    # User 1 creates checkin
    payload = {
        "sleep_hours": 7.0,
        "resting_heart_rate": 65,
        "hrv_ms": 50.0,
        "soreness": 4,
        "energy_level": 7,
    }
    create_res = client.post("/api/v1/recovery/checkins", json=payload, headers=headers1)
    checkin_id = create_res.json()["id"]

    # User 1 can retrieve their checkin
    get_res1 = client.get(f"/api/v1/recovery/checkins/{checkin_id}", headers=headers1)
    assert get_res1.status_code == 200

    # User 2 CANNOT retrieve User 1's checkin (returns 404)
    get_res2 = client.get(f"/api/v1/recovery/checkins/{checkin_id}", headers=headers2)
    assert get_res2.status_code == 404


def test_invalid_input_rejected():
    user_id = "33333333-3333-3333-3333-333333333333"
    token = make_test_token(user_id)
    headers = {"Authorization": f"Bearer {token}"}

    # Invalid sleep (negative)
    res_sleep_neg = client.post(
        "/api/v1/recovery/checkins",
        json={"sleep_hours": -1.0, "resting_heart_rate": 60, "soreness": 3, "energy_level": 7},
        headers=headers,
    )
    assert res_sleep_neg.status_code == 422

    # Invalid resting HR (> 240)
    res_rhr_high = client.post(
        "/api/v1/recovery/checkins",
        json={"sleep_hours": 8.0, "resting_heart_rate": 300, "soreness": 3, "energy_level": 7},
        headers=headers,
    )
    assert res_rhr_high.status_code == 422

    # Invalid soreness (> 10)
    res_soreness_high = client.post(
        "/api/v1/recovery/checkins",
        json={"sleep_hours": 8.0, "resting_heart_rate": 60, "soreness": 15, "energy_level": 7},
        headers=headers,
    )
    assert res_soreness_high.status_code == 422

    # Invalid energy level (0)
    res_energy_low = client.post(
        "/api/v1/recovery/checkins",
        json={"sleep_hours": 8.0, "resting_heart_rate": 60, "soreness": 3, "energy_level": 0},
        headers=headers,
    )
    assert res_energy_low.status_code == 422


def test_ml_recovery_score_prediction():
    user_id = "44444444-4444-4444-4444-444444444444"
    token = make_test_token(user_id)
    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "sleep_hours": 8.0,
        "resting_heart_rate": 58,
        "hrv_ms": 62.0,
        "soreness": 2,
        "energy_level": 9,
    }

    # Test standalone prediction endpoint
    pred_res = client.post("/api/v1/recovery/predict-score", json=payload, headers=headers)
    assert pred_res.status_code == 200
    pred_data = pred_res.json()
    assert 0.0 <= pred_data["score"] <= 100.0
    assert pred_data["tier"] in ["optimal", "moderate", "low", "critical"]
    assert "experimental wellness estimate" in pred_data["disclaimer"].lower()
    assert pred_data["observed_features_count"] > 0
    assert pred_data["imputed_features_count"] > 0


    # Test check-in creation includes ML prediction
    create_res = client.post("/api/v1/recovery/checkins", json=payload, headers=headers)
    assert create_res.status_code == 201
    created = create_res.json()
    assert "prediction" in created
    assert created["prediction"] is not None
    assert 0.0 <= created["prediction"]["score"] <= 100.0
    assert len(created["prediction"]["contributing_factors"]) > 0


def test_get_personalized_recovery_plan():
    user_id = "55555555-5555-5555-5555-555555555555"
    token = make_test_token(user_id)
    headers = {"Authorization": f"Bearer {token}"}

    plan_res = client.get("/api/v1/recovery/plan", headers=headers)
    assert plan_res.status_code == 200
    plan = plan_res.json()
    assert plan["user_id"] == user_id
    assert plan["totalPhases"] == 4
    assert len(plan["phases"]) == 4
    assert plan["phases"][0]["phaseNumber"] == 1
    assert len(plan["phases"][0]["activities"]) > 0
    assert len(plan["safetyGuidelines"]) > 0
    assert "evidence-based" in plan["disclaimer"].lower() or "wellness" in plan["disclaimer"].lower()
