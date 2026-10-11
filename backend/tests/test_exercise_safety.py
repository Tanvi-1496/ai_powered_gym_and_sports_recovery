from fastapi.testclient import TestClient
from app.main import app
from app.schemas.exercises import (
    ExerciseAssessmentRequest,
    DoctorGuidanceInput,
)
from app.services.exercise_recommender import recommend_exercises
from app.services.safety_filters import (
    evaluate_assessment_safety,
    audit_warning_signs,
    WARNING_SIGN_RULES,
)
from app.services.exercise_catalog import get_all_exercises

client = TestClient(app)


def test_severe_pain_without_guidance_withholds_for_prompt_assessment():
    """
    Clinical rule: Severe pain (VAS >= 8/10) without explicit clinician clearance
    must NOT automatically assume gentle isometrics are safe.
    It MUST withhold exercises for prompt professional assessment,
    and must NOT classify it as an emergency solely because of the pain score.
    """
    assessment = ExerciseAssessmentRequest(
        body_areas=["knee"],
        symptoms=["intense anterior tendon pain after heavy loading"],
        pain_severity=8,
        duration="<1_day",
        # No doctor_guidance provided
    )
    result = recommend_exercises(assessment)
    assert result.status == "withheld"
    assert result.triage_level == "prompt_medical_assessment"
    assert len(result.activities) == 0
    assert "Severe pain severity (8/10) reported without clinician-reviewed clearance" in result.safety_summary
    assert "in-person medical evaluation" in result.safety_summary
    # Verify it is NOT labeled emergency
    assert result.triage_level != "emergency"


def test_severe_pain_with_clinician_clearance_allows_conservative_mode():
    """
    Clinical rule: Severe pain (VAS >= 8/10) WITH explicit clinician clearance
    is allowed under conservative clinical oversight (strictly gentle exercises only).
    """
    doctor_guidance = DoctorGuidanceInput(
        clinician_clearance_granted=True,
        medical_clearance_required=False,
        max_allowed_intensity="gentle",
        clinical_notes="Evaluated in clinic: acute tendon flare without structural tear. Cleared for pain-free isometrics.",
    )
    assessment = ExerciseAssessmentRequest(
        body_areas=["knee"],
        symptoms=["severe tendon ache"],
        pain_severity=8,
        doctor_guidance=doctor_guidance,
    )
    result = recommend_exercises(assessment)
    assert result.status == "conservative_guidance"
    assert result.triage_level == "standard_monitoring"
    assert len(result.activities) > 0
    for act in result.activities:
        assert act.difficulty == "gentle"
        assert "Clinician-Supervised Conservative Mode" in (act.safetyNote or "")


def test_worsening_symptoms_trigger_prompt_medical_assessment():
    """
    Clinical rule: Symptoms reported as rapidly worsening or escalating
    require prompt clinical assessment before unguided exercise.
    """
    assessment = ExerciseAssessmentRequest(
        body_areas=["shoulder"],
        symptoms=["rotator cuff pain rapidly worsening daily"],
        pain_severity=5,
    )
    result = recommend_exercises(assessment)
    assert result.status == "withheld"
    assert result.triage_level == "prompt_medical_assessment"
    assert len(result.activities) == 0
    assert "PROMPT_WORSENING_SYMPTOMS" in result.safety_summary or "escalating" in result.safety_summary.lower()


def test_emergency_indicators_separate_from_prompt_assessment():
    """
    Clinical rule: Emergency warning signs (cauda equina, gross deformity, acute dislocation,
    septic arthritis) are strictly categorized as 'emergency' triage.
    """
    # Test Cauda Equina emergency indicator
    assessment_cauda = ExerciseAssessmentRequest(
        body_areas=["lower_back"],
        symptoms=["low back ache with loss of bladder control and saddle anesthesia"],
        pain_severity=6,
    )
    result_cauda = recommend_exercises(assessment_cauda)
    assert result_cauda.status == "withheld"
    assert result_cauda.triage_level == "emergency"
    assert len(result_cauda.activities) == 0
    assert "Emergency clinical warning sign detected" in result_cauda.safety_summary

    # Test Gross Deformity / Fracture emergency indicator
    assessment_deformity = ExerciseAssessmentRequest(
        body_areas=["ankle"],
        symptoms=["severe trauma with gross deformity and suspected fracture"],
        pain_severity=7,
    )
    result_def = recommend_exercises(assessment_deformity)
    assert result_def.status == "withheld"
    assert result_def.triage_level == "emergency"
    assert len(result_def.activities) == 0


def test_prompt_assessment_indicators_distinct_from_emergency():
    """
    Clinical rule: Signs like inability to bear weight or peripheral numbness
    warrant prompt professional assessment, NOT emergency room classification.
    """
    assessment = ExerciseAssessmentRequest(
        body_areas=["ankle"],
        symptoms=["lateral ankle sprain"],
        movement_limitations=["inability to bear weight"],
        pain_severity=6,
    )
    result = recommend_exercises(assessment)
    assert result.status == "withheld"
    assert result.triage_level == "prompt_medical_assessment"
    assert result.triage_level != "emergency"
    assert len(result.activities) == 0


def test_doctor_guidance_medical_clearance_required_withholds():
    """
    Doctor Guidance contract: When medical_clearance_required is True, withhold all exercises.
    """
    doctor_guidance = DoctorGuidanceInput(
        medical_clearance_required=True,
        clinical_notes="Pending knee MRI for suspected meniscal flap.",
    )
    assessment = ExerciseAssessmentRequest(
        body_areas=["knee"],
        symptoms=["joint line tenderness"],
        pain_severity=4,
        doctor_guidance=doctor_guidance,
    )
    result = recommend_exercises(assessment)
    assert result.status == "withheld"
    assert result.triage_level == "prompt_medical_assessment"
    assert len(result.activities) == 0
    assert "Formal medical clearance is required" in result.safety_summary


def test_doctor_guidance_conflicting_restrictions_filtered():
    """
    Doctor Guidance contract: Disallowed movement tags and restriction codes
    filter out conflicting catalog exercises.
    """
    # Shoulder with overhead restriction
    doctor_guidance = DoctorGuidanceInput(
        disallowed_movement_tags=["overhead_mobility"],
        restriction_codes=["RESTRICT_DEEP_FLEXION"],
    )
    assessment = ExerciseAssessmentRequest(
        body_areas=["shoulder"],
        symptoms=["scapular dyskinesis"],
        pain_severity=3,
        doctor_guidance=doctor_guidance,
    )
    result = recommend_exercises(assessment)
    assert result.status == "recommended"
    assert len(result.activities) > 0
    # Verify no recommended activity contains overhead_mobility
    for act in result.activities:
        assert act.id != "shoulder-scapular-wall-slide"


def test_absence_of_eligible_exercises_returns_no_match():
    """
    When all candidate exercises are filtered out by restrictions or review status,
    system returns status 'no_match' with detailed audit log.
    """
    doctor_guidance = DoctorGuidanceInput(
        disallowed_movement_tags=[
            "knee_isometric",
            "patellar_loading",
            "closed_chain",
            "quadriceps_activation",
            "non_compressive",
            "gentle_mobility",
        ],
    )
    assessment = ExerciseAssessmentRequest(
        body_areas=["knee"],
        symptoms=["soreness"],
        pain_severity=3,
        doctor_guidance=doctor_guidance,
    )
    result = recommend_exercises(assessment)
    assert result.status == "no_match"
    assert len(result.activities) == 0
    assert result.excluded_count > 0


def test_unapproved_exercises_excluded_from_automatic_recommendations():
    """
    Clinical evidence audit rule: Any exercise marked 'pending_review'
    MUST be excluded from automated exercise recommendations.
    """
    # 1. Test using a catalog override containing only a pending_review entry
    pending_only_catalog = [
        {
            "id": "mock-pending-exercise",
            "name": "Mock Pending Drill",
            "target_body_area": "knee",
            "secondary_areas": [],
            "purpose": "Awaiting clinical validation.",
            "instructions": ["Step 1"],
            "difficulty": "gentle",
            "equipment": "bodyweight",
            "movement_tags": ["gentle_mobility"],
            "contraindications": [],
            "precautions": [],
            "verified_sources": [],
            "source_urls": [],
            "review_status": "pending_review",
            "review_notes": "Pending clinical validation",
            "default_sets": 2,
            "default_reps": 10,
            "default_duration": None,
            "frequency": "Daily",
        }
    ]
    assessment = ExerciseAssessmentRequest(
        body_areas=["knee"],
        symptoms=["mild soreness"],
        pain_severity=3,
    )
    result = recommend_exercises(assessment, catalog_override=pending_only_catalog)
    assert result.status == "no_match"
    assert len(result.activities) == 0
    assert result.excluded_count == 1

    # 2. Test live catalog recommendations: ensure every returned activity is approved
    all_catalog_pending_ids = {
        ex["id"]
        for ex in get_all_exercises(approved_only=False)
        if ex.get("review_status") == "pending_review"
    }
    live_result = recommend_exercises(assessment)
    for act in live_result.activities:
        assert act.reviewStatus == "approved"
        assert act.id not in all_catalog_pending_ids


def test_standalone_safety_check_api_endpoint():
    """Verify POST /api/v1/exercises/safety-check triage reporting."""
    # Emergency check
    resp_em = client.post(
        "/api/v1/exercises/safety-check",
        json={
            "body_areas": ["lower_back"],
            "symptoms": ["loss of bowel and bladder with numbness in groin"],
            "pain_severity": 5,
        },
    )
    assert resp_em.status_code == 200
    data_em = resp_em.json()
    assert data_em["triage_level"] == "emergency"
    assert data_em["withhold_recommendation"] is True

    # Severe pain check without guidance
    resp_sev = client.post(
        "/api/v1/exercises/safety-check",
        json={
            "body_areas": ["knee"],
            "symptoms": ["severe aching"],
            "pain_severity": 9,
        },
    )
    assert resp_sev.status_code == 200
    data_sev = resp_sev.json()
    assert data_sev["triage_level"] == "prompt_medical_assessment"
    assert data_sev["withhold_recommendation"] is True
