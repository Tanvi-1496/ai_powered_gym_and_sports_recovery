"""End-to-End Cross-Module Integration Test for REVORA.

Verifies end-to-end integration across all modules:
1. Injury-risk prediction model & strain triage
2. Personalized exercise recommendations with clinical safety filters
3. Doctor consultation, clinical guidance, and red-flag triage
4. Physiological recovery-score regression model (ExtraTrees)
5. Multi-phase recovery plan generation
"""

import jwt
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.core.config import settings

client = TestClient(app)
TEST_SECRET = "test-secret-that-is-at-least-32-bytes-long"


def make_token(user_id: str, email: str = "athlete@example.com") -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "role": "authenticated",
        "aud": "authenticated",
    }
    return jwt.encode(payload, TEST_SECRET, algorithm="HS256")


@pytest.fixture(autouse=True)
def ensure_auth_config():
    old_secret = settings.SUPABASE_JWT_SECRET
    settings.SUPABASE_JWT_SECRET = TEST_SECRET
    yield
    settings.SUPABASE_JWT_SECRET = old_secret


def test_e2e_injury_risk_and_recovery_score_separation():
    """Verify Injury Risk and Recovery Score remain strictly separate outputs."""
    user_id = "11111111-1111-1111-1111-111111111111"
    headers = {"Authorization": f"Bearer {make_token(user_id)}"}

    # 1. Recovery Score (autonomic/physiological readiness: 0-100)
    checkin_payload = {
        "sleep_hours": 8.0,
        "resting_heart_rate": 56,
        "hrv_ms": 68.0,
        "soreness": 2,
        "energy_level": 9,
    }
    rec_res = client.post("/api/v1/recovery/predict-score", json=checkin_payload, headers=headers)
    assert rec_res.status_code == 200
    rec_data = rec_res.json()
    assert 0.0 <= rec_data["score"] <= 100.0
    assert rec_data["tier"] in ["optimal", "moderate", "low", "critical"]
    assert "experimental wellness estimate" in rec_data["disclaimer"].lower()

    # 2. Injury Risk (biomechanical localized strain evaluation)
    injury_payload = {
        "body_areas": ["knee"],
        "symptoms": ["patellar tendon ache"],
        "pain_severity": 6,
        "duration": "1-3_days",
        "movement_limitations": ["cannot squat past 90 degrees"],
    }
    risk_res = client.post("/api/v1/injury-risk/predict", json=injury_payload)
    assert risk_res.status_code == 200
    risk_data = risk_res.json()
    assert risk_data["predictedRiskArea"] == "Knee"
    assert risk_data["riskLevel"] in ["low", "moderate", "elevated", "high"]
    assert risk_data["modelMetadata"]["distinctFromRecoveryScore"] is True


def test_e2e_doctor_guidance_to_exercise_recommendation_contract():
    """Verify Module 2 Doctor Guidance output feeds directly into Module 3 recommendations."""
    # 1. Athlete with subacromial shoulder impingement
    presentation = {
        "body_areas": ["shoulder"],
        "pain_severity": 4,
        "symptoms": ["subacromial impingement", "overhead pain"],
        "duration": "1-3_days",
        "movement_limitations": ["cannot lift arm overhead"],
        "warning_signs_screening": {
            "screening_completed": True,
            "emergency_signs_present": [],
            "prompt_assessment_signs_present": [],
        },
    }

    # Evaluate via Module 2
    guidance_res = client.post("/api/v1/doctor-guidance/evaluate", json=presentation)
    assert guidance_res.status_code == 200
    guidance_data = guidance_res.json()

    assert guidance_data["triage_level"] == "standard_monitoring"
    assert "RESTRICT_OVERHEAD" in guidance_data["active_restriction_codes"]
    assert "overhead_press" in guidance_data["active_disallowed_movement_tags"]

    # Verify Module 3 contract payload is present
    mod3_contract = guidance_data["module3_doctor_guidance"]
    assert mod3_contract is not None
    assert "RESTRICT_OVERHEAD" in mod3_contract["restriction_codes"]

    # Pass contract directly into Module 3 recommendations
    rec_payload = {
        "body_areas": presentation["body_areas"],
        "symptoms": presentation["symptoms"],
        "pain_severity": presentation["pain_severity"],
        "duration": presentation["duration"],
        "movement_limitations": presentation["movement_limitations"],
        "doctor_guidance": mod3_contract,
    }
    rec_res = client.post("/api/v1/exercises/recommendations", json=rec_payload)
    assert rec_res.status_code == 200
    rec_data = rec_res.json()
    assert rec_data["status"] == "recommended"
    # Ensure no overhead movement tag leaked into recommended exercises
    for act in rec_data["activities"]:
        assert "overhead" not in act["name"].lower()


def test_e2e_emergency_triage_withholds_exercise_recommendations():
    """Verify emergency red flag immediately withholds recommendations."""
    presentation = {
        "body_areas": ["lower_back"],
        "pain_severity": 8,
        "symptoms": ["loss of bladder control with saddle numbness"],
        "warning_signs_screening": {
            "screening_completed": True,
            "emergency_signs_present": ["cauda equina red flag: saddle anesthesia / bowel dysfunction"],
            "prompt_assessment_signs_present": [],
        },
    }

    guidance_res = client.post("/api/v1/doctor-guidance/evaluate", json=presentation)
    assert guidance_res.status_code == 200
    guidance_data = guidance_res.json()
    assert guidance_data["triage_level"] == "emergency"

    # Module 3 recommendation engine receives emergency guidance
    rec_res = client.post(
        "/api/v1/exercises/recommendations",
        json={
            "body_areas": ["lower_back"],
            "symptoms": ["cauda equina"],
            "pain_severity": 8,
            "doctor_guidance": guidance_data["module3_doctor_guidance"],
        },
    )
    assert rec_res.status_code == 200
    rec_data = rec_res.json()
    assert rec_data["status"] == "withheld"
    assert rec_data["triage_level"] == "emergency"
    assert len(rec_data["activities"]) == 0


def test_e2e_full_recovery_plan_endpoint():
    """Verify both Module 3 standalone plan endpoint and authenticated Revora 4-phase plan."""
    # 1. Module 3 standalone convenience endpoint
    payload = {
        "body_areas": ["knee"],
        "symptoms": ["patellar tendon ache"],
        "pain_severity": 3,
        "duration": "1-3_days",
    }
    resp = client.post("/api/v1/exercises/recovery-plan", json=payload)
    assert resp.status_code == 200
    plan = resp.json()
    assert plan["totalPhases"] >= 1
    assert len(plan["phases"]) >= 1
    assert plan["phases"][0]["phaseNumber"] == 1
    assert len(plan["phases"][0]["activities"]) > 0
    assert len(plan["safetyGuidelines"]) > 0

    # 2. Revora authenticated core recovery plan endpoint (4 full phases)
    user_id = "77777777-7777-7777-7777-777777777777"
    headers = {"Authorization": f"Bearer {make_token(user_id)}"}
    core_plan_res = client.get("/api/v1/recovery/plan", headers=headers)
    assert core_plan_res.status_code == 200
    core_plan = core_plan_res.json()
    assert core_plan["totalPhases"] == 4
    assert len(core_plan["phases"]) == 4
    assert core_plan["phases"][0]["phaseNumber"] == 1
    assert len(core_plan["phases"][0]["activities"]) > 0


def test_e2e_low_severity_flow():
    """Verify low symptom severity (VAS 2) produces low risk and normal recommended activities."""
    presentation = {
        "body_areas": ["ankle"],
        "pain_severity": 2,
        "symptoms": ["mild stiffness"],
        "duration": "1-3_days",
        "warning_signs_screening": {
            "screening_completed": True,
            "emergency_signs_present": [],
            "prompt_assessment_signs_present": [],
        },
    }

    # 1. Doctor guidance evaluates to standard monitoring
    guidance_res = client.post("/api/v1/doctor-guidance/evaluate", json=presentation)
    assert guidance_res.status_code == 200
    guidance = guidance_res.json()
    assert guidance["triage_level"] == "standard_monitoring"
    assert guidance["module3_doctor_guidance"]["medical_clearance_required"] is False

    # 2. Injury risk evaluates to low strain
    risk_res = client.post("/api/v1/injury-risk/predict", json={
        "body_areas": ["ankle"],
        "pain_severity": 2,
    })
    assert risk_res.status_code == 200
    risk = risk_res.json()
    assert risk["riskLevel"] == "low"
    assert risk["confidence"] is None  # Verifies no fake model confidence

    # 3. Exercise recommendations are granted
    rec_res = client.post("/api/v1/exercises/recommendations", json={
        "body_areas": ["ankle"],
        "pain_severity": 2,
        "doctor_guidance": guidance["module3_doctor_guidance"],
    })
    assert rec_res.status_code == 200
    rec = rec_res.json()
    assert rec["status"] == "recommended"
    assert len(rec["activities"]) > 0


def test_e2e_moderate_severity_with_movement_restriction():
    """Verify moderate severity triggers specific movement restriction and filters out contraindicated exercises."""
    presentation = {
        "body_areas": ["knee"],
        "pain_severity": 5,
        "symptoms": ["anterior knee pain behind kneecap"],
        "duration": "4-7_days",
        "movement_limitations": ["pain bending knee past 90 degrees"],
        "warning_signs_screening": {
            "screening_completed": True,
            "emergency_signs_present": [],
            "prompt_assessment_signs_present": [],
        },
    }

    guidance_res = client.post("/api/v1/doctor-guidance/evaluate", json=presentation)
    assert guidance_res.status_code == 200
    guidance = guidance_res.json()
    assert "RESTRICT_DEEP_FLEXION" in guidance["active_restriction_codes"]
    assert "deep_knee_flexion" in guidance["active_disallowed_movement_tags"]

    rec_res = client.post("/api/v1/exercises/recommendations", json={
        "body_areas": ["knee"],
        "pain_severity": 5,
        "movement_limitations": ["pain bending knee past 90 degrees"],
        "doctor_guidance": guidance["module3_doctor_guidance"],
    })
    assert rec_res.status_code == 200
    rec = rec_res.json()
    assert rec["status"] in ["recommended", "conservative_guidance"]
    # Verify no exercise with deep knee flexion tag is recommended
    for activity in rec["activities"]:
        assert "deep squat" not in activity["name"].lower()


def test_e2e_high_severity_withholds_exercises_without_clearance():
    """Verify high symptom severity (VAS 9) without clearance strictly withholds exercises."""
    presentation = {
        "body_areas": ["knee"],
        "pain_severity": 9,
        "symptoms": ["severe acute joint pain"],
        "warning_signs_screening": {
            "screening_completed": True,
            "emergency_signs_present": [],
            "prompt_assessment_signs_present": [],
        },
    }

    guidance_res = client.post("/api/v1/doctor-guidance/evaluate", json=presentation)
    assert guidance_res.status_code == 200
    guidance = guidance_res.json()
    assert guidance["triage_level"] == "prompt_medical_assessment"
    assert guidance["module3_doctor_guidance"]["medical_clearance_required"] is True

    rec_res = client.post("/api/v1/exercises/recommendations", json={
        "body_areas": ["knee"],
        "pain_severity": 9,
        "doctor_guidance": guidance["module3_doctor_guidance"],
    })
    assert rec_res.status_code == 200
    rec = rec_res.json()
    assert rec["status"] == "withheld"
    assert len(rec["activities"]) == 0
    assert "medical clearance" in rec["safety_summary"].lower()


def test_e2e_high_severity_unlocked_with_authorized_clearance():
    """Verify authorized clinician clearance safely unlocks conservative exercise guidance for severe pain."""
    from datetime import date, timedelta
    presentation = {
        "body_areas": ["knee"],
        "pain_severity": 8,
        "symptoms": ["post-operative joint soreness"],
        "warning_signs_screening": {
            "screening_completed": True,
            "emergency_signs_present": [],
            "prompt_assessment_signs_present": [],
        },
        "clearance_submission": {
            "attestation_type": "direct_clinician_entry",
            "clinician_name": "Dr. Sarah Lin, DPT, OCS",
            "license_number": "PT-948201",
            "licensing_jurisdiction": "California Medical Board",
            "clinician_role": "physical_therapist",
            "institution_or_clinic": "Pacific Sports Physical Therapy",
            "evaluation_date": (date.today() - timedelta(days=2)).isoformat(),
            "clinician_declaration_signed": True,
            "clearance_scope": "conservative_rehab_only",
        },
    }

    guidance_res = client.post("/api/v1/doctor-guidance/evaluate", json=presentation)
    assert guidance_res.status_code == 200
    guidance = guidance_res.json()
    assert guidance["clearance_validation"]["is_valid"] is True
    assert guidance["module3_doctor_guidance"]["clinician_clearance_granted"] is True
    assert guidance["module3_doctor_guidance"]["medical_clearance_required"] is False

    rec_res = client.post("/api/v1/exercises/recommendations", json={
        "body_areas": ["knee"],
        "pain_severity": 8,
        "doctor_guidance": guidance["module3_doctor_guidance"],
    })
    assert rec_res.status_code == 200
    rec = rec_res.json()
    assert rec["status"] == "conservative_guidance"
    assert len(rec["activities"]) > 0
    # Every recommended activity in conservative mode must be gentle
    for act in rec["activities"]:
        assert act["difficulty"] == "gentle"
