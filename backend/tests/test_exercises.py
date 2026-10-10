from fastapi.testclient import TestClient
import pytest
from pydantic import ValidationError
from app.main import app
from app.schemas.exercises import (
    ExerciseAssessmentRequest,
    DoctorGuidanceInput,
)
from app.services.exercise_recommender import (
    recommend_exercises,
    build_recovery_plan,
)
from app.services.exercise_catalog import (
    get_all_exercises,
    get_exercise_by_id,
    get_exercises_for_body_area,
)

client = TestClient(app)


def test_catalog_loader_and_contents():
    """Verify exercise catalog loads clinical entries successfully."""
    exercises = get_all_exercises()
    assert len(exercises) >= 15
    first = exercises[0]
    assert "id" in first
    assert "name" in first
    assert "target_body_area" in first
    assert "movement_tags" in first
    assert "verified_sources" in first
    assert "source_urls" in first
    assert "review_status" in first


def test_catalog_approved_only_filtering():
    """Verify approved_only parameter separates approved entries from pending_review."""
    all_ex = get_all_exercises(approved_only=False)
    approved_ex = get_all_exercises(approved_only=True)
    assert len(all_ex) > len(approved_ex)
    assert all(ex["review_status"] == "approved" for ex in approved_ex)


def test_catalog_query_by_body_area():
    """Verify catalog queries match target and secondary anatomical areas."""
    knee_drills = get_exercises_for_body_area("knee", approved_only=True)
    assert len(knee_drills) >= 2
    assert any("spanish" in ex["name"].lower() for ex in knee_drills)

    shoulder_drills = get_exercises_for_body_area("shoulder", approved_only=True)
    assert len(shoulder_drills) >= 2


def test_recommend_exercises_single_region_knee():
    """Test recommendation engine for single region knee complaint."""
    assessment = ExerciseAssessmentRequest(
        body_areas=["knee"],
        symptoms=["anterior knee ache after running"],
        pain_severity=4,
        duration="1-3_days",
    )
    result = recommend_exercises(assessment)
    assert result.status == "recommended"
    assert result.triage_level == "standard_monitoring"
    assert len(result.activities) > 0
    assert result.target_areas == ["knee"]
    # Check activity schema
    activity = result.activities[0]
    assert activity.targetArea == "knee"
    assert activity.safetyNote is not None
    assert activity.reviewStatus == "approved"
    assert len(activity.sourceUrls) > 0


def test_recommend_exercises_multi_region_knee_and_lower_back():
    """Test recommendation engine handling multiple injury locations simultaneously."""
    assessment = ExerciseAssessmentRequest(
        body_areas=["knee", "lower_back"],
        symptoms=["stiff knee", "dull lumbar ache"],
        pain_severity=3,
        duration="4-7_days",
    )
    result = recommend_exercises(assessment)
    assert result.status == "recommended"
    target_areas_in_activities = {act.targetArea for act in result.activities}
    assert "knee" in target_areas_in_activities
    assert "lower_back" in target_areas_in_activities


def test_recommend_exercises_no_matching_area():
    """Test safe handling when an unknown/unsupported body area is supplied."""
    assessment = ExerciseAssessmentRequest(
        body_areas=["unsupported_alien_zone"],
        symptoms=["discomfort"],
        pain_severity=2,
    )
    result = recommend_exercises(assessment)
    assert result.status == "no_match"
    assert len(result.activities) == 0
    assert "No suitable exercises found" in result.safety_summary


def test_missing_body_area_fails_validation():
    """Verify that requests missing body areas are rejected by validation schema."""
    with pytest.raises(ValidationError):
        ExerciseAssessmentRequest(
            body_areas=[],  # min_length=1
            symptoms=["pain"],
            pain_severity=3,
        )


def test_recovery_plan_adapter():
    """Test adapter that builds full multi-phase RecoveryPlan for frontend."""
    assessment = ExerciseAssessmentRequest(
        body_areas=["shoulder"],
        symptoms=["impingement pinch"],
        pain_severity=4,
    )
    recs = recommend_exercises(assessment)
    plan = build_recovery_plan(recs, assessment)
    assert plan.id.startswith("plan_")
    assert plan.status == "active"
    assert len(plan.phases) >= 1
    assert plan.phases[0].status == "current"
    assert len(plan.phases[0].activities) > 0


def test_api_recommendations_endpoint():
    """Test FastAPI POST /api/v1/exercises/recommendations endpoint."""
    payload = {
        "body_areas": ["ankle"],
        "symptoms": ["mild lateral soreness after trail run"],
        "pain_severity": 3,
        "duration": "1-3_days",
    }
    response = client.post("/api/v1/exercises/recommendations", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "recommended"
    assert data["triage_level"] == "standard_monitoring"
    assert len(data["activities"]) > 0
    assert "clinical_disclaimer" in data


def test_api_catalog_endpoints():
    """Test FastAPI GET /api/v1/exercises/catalog and detail endpoint."""
    resp_all = client.get("/api/v1/exercises/catalog")
    assert resp_all.status_code == 200
    all_data = resp_all.json()
    assert len(all_data) >= 15

    # Filter approved only
    resp_approved = client.get("/api/v1/exercises/catalog?approved_only=true")
    assert resp_approved.status_code == 200
    approved_data = resp_approved.json()
    assert len(approved_data) < len(all_data)

    # Filter by body area
    resp_filtered = client.get("/api/v1/exercises/catalog?body_area=knee")
    assert resp_filtered.status_code == 200
    filtered_data = resp_filtered.json()
    assert len(filtered_data) >= 3

    # Detail lookup
    sample_id = filtered_data[0]["id"]
    resp_detail = client.get(f"/api/v1/exercises/catalog/{sample_id}")
    assert resp_detail.status_code == 200
    assert resp_detail.json()["id"] == sample_id

    # 404 lookup
    resp_404 = client.get("/api/v1/exercises/catalog/non_existent_exercise_123")
    assert resp_404.status_code == 404
