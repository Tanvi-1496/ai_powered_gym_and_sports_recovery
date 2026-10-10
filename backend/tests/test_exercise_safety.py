from fastapi.testclient import TestClient
from app.main import app
from app.schemas.exercises import (
    ExerciseAssessmentRequest,
    DoctorGuidanceInput,
)
from app.services.exercise_recommender import recommend_exercises
from app.services.safety_filters import (
    evaluate_assessment_safety,
    check_red_flags,
)

client = TestClient(app)


def test_severe_pain_triggers_conservative_handling_not_emergency_withhold():
    """
    Clinician rule: Severe pain (>= 8/10) should NOT blindly withhold every exercise as an emergency.
    It triggers conservative handling (gentle, unloaded isometrics only) and caution warnings.
    """
    assessment = ExerciseAssessmentRequest(
        body_areas=["knee"],
        symptoms=["intense anterior tendon pain after heavy loading"],
        pain_severity=8,
        duration="<1_day",
    )
    result = recommend_exercises(assessment)
    assert result.status == "conservative_guidance"
    assert len(result.activities) > 0
    # Every recommended activity in conservative mode MUST be gentle
    for act in result.activities:
        assert act.difficulty == "gentle"
        assert "Conservative Mode" in (act.safetyNote or "")
    # Check that high pain warning is attached
    assert any("High pain rating (8/10)" in w for w in result.warnings)


def test_red_flag_symptoms_withhold_recommendations():
    """
    True medical red flags (numbness, inability to bear weight, deformity, etc.)
    MUST immediately withhold exercises with medical evaluation instruction.
    """
    # Test numbness / tingling
    assessment = ExerciseAssessmentRequest(
        body_areas=["lower_back"],
        symptoms=["dull ache with tingling and numbness radiating down foot"],
        pain_severity=6,
    )
    result = recommend_exercises(assessment)
    assert result.status == "withheld"
    assert len(result.activities) == 0
    assert "Red-flag symptom detected" in result.safety_summary
    assert "immediate in-person medical evaluation" in result.safety_summary

    # Test inability to bear weight
    assessment_weight = ExerciseAssessmentRequest(
        body_areas=["ankle"],
        symptoms=["severe swelling"],
        movement_limitations=["inability to bear weight after landing"],
        pain_severity=7,
    )
    result_weight = recommend_exercises(assessment_weight)
    assert result_weight.status == "withheld"
    assert len(result_weight.activities) == 0


def test_doctor_guidance_clearance_required_withholds():
    """
    When doctor guidance specifies medical clearance required, withhold all exercises.
    """
    doctor_guidance = DoctorGuidanceInput(
        medical_clearance_required=True,
        clinical_notes="Suspected grade 2 MCL sprain pending MRI.",
    )
    assessment = ExerciseAssessmentRequest(
        body_areas=["knee"],
        symptoms=["medial joint line tenderness"],
        pain_severity=5,
        doctor_guidance=doctor_guidance,
    )
    result = recommend_exercises(assessment)
    assert result.status == "withheld"
    assert len(result.activities) == 0
    assert "Medical clearance is required" in result.safety_summary
    assert "grade 2 MCL" in result.safety_summary


def test_doctor_guidance_disallowed_movement_tags_filtered():
    """
    Verify exercises tagged with doctor-disallowed movement tags are excluded.
    """
    # Shoulder with restriction on overhead mobility
    doctor_guidance = DoctorGuidanceInput(
        disallowed_movement_tags=["overhead_mobility", "overhead_press"],
    )
    assessment = ExerciseAssessmentRequest(
        body_areas=["shoulder"],
        symptoms=["rotator cuff strain"],
        pain_severity=4,
        doctor_guidance=doctor_guidance,
    )
    result = recommend_exercises(assessment)
    assert result.status == "recommended"
    assert len(result.activities) > 0
    assert result.excluded_count > 0
    # Scapular wall slide (has overhead_mobility) should NOT be in activities
    for act in result.activities:
        assert act.id != "shoulder-scapular-wall-slide"


def test_doctor_guidance_restriction_codes():
    """
    Verify standardized restriction codes (e.g. RESTRICT_DEEP_FLEXION) map to tags and filter exercises.
    """
    doctor_guidance = DoctorGuidanceInput(
        restriction_codes=["RESTRICT_DEEP_FLEXION"],
    )
    assessment = ExerciseAssessmentRequest(
        body_areas=["knee"],
        symptoms=["retropatellar irritation"],
        pain_severity=4,
        doctor_guidance=doctor_guidance,
    )
    result = recommend_exercises(assessment)
    assert result.status == "recommended"
    # Wall slide squat (tagged with partial_flexion) should be excluded
    for act in result.activities:
        assert act.id != "knee-wall-slide-squat"


def test_doctor_guidance_intensity_capping():
    """
    When doctor caps intensity to 'gentle', all moderate and advanced exercises are excluded.
    """
    doctor_guidance = DoctorGuidanceInput(
        max_allowed_intensity="gentle",
    )
    assessment = ExerciseAssessmentRequest(
        body_areas=["knee"],
        symptoms=["mild soreness"],
        pain_severity=3,
        doctor_guidance=doctor_guidance,
    )
    result = recommend_exercises(assessment)
    assert result.status == "recommended"
    for act in result.activities:
        assert act.difficulty == "gentle"


def test_api_safety_check_endpoint():
    """Test standalone POST /api/v1/exercises/safety-check endpoint."""
    # Safe request
    payload_safe = {
        "body_areas": ["knee"],
        "symptoms": ["general stiffness"],
        "pain_severity": 3,
    }
    resp_safe = client.post("/api/v1/exercises/safety-check", json=payload_safe)
    assert resp_safe.status_code == 200
    data_safe = resp_safe.json()
    assert data_safe["is_safe"] is True
    assert data_safe["withhold_recommendation"] is False
    assert data_safe["is_conservative"] is False

    # Red flag request
    payload_redflag = {
        "body_areas": ["shoulder"],
        "symptoms": ["complete joint locking with numbness"],
        "pain_severity": 7,
    }
    resp_rf = client.post("/api/v1/exercises/safety-check", json=payload_redflag)
    assert resp_rf.status_code == 200
    data_rf = resp_rf.json()
    assert data_rf["withhold_recommendation"] is True
    assert "Red-flag symptom detected" in data_rf["withhold_reason"]
