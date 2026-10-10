from datetime import date, timedelta
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.schemas.guidance import (
    AthleteClinicalPresentation,
    ClinicianClearanceSubmission,
    WarningSignsScreening,
)
from app.services.doctor_guidance import (
    evaluate_doctor_guidance,
    validate_clinician_clearance,
    get_all_guidance_rules,
    CLINICAL_GUIDANCE_RULES,
)
from app.schemas.exercises import ExerciseAssessmentRequest
from app.services.exercise_recommender import recommend_exercises


@pytest.fixture
def client():
    return TestClient(app)


# ─────────────────────────────────────────────────────────────────────────────
# 1. Clinician Clearance Validation Tests (Adjustment 3)
# ─────────────────────────────────────────────────────────────────────────────

def test_athlete_self_report_clearance_is_strictly_rejected():
    """Athlete self-reported clearance must be rejected unconditionally."""
    submission = ClinicianClearanceSubmission(
        attestation_type="athlete_self_report",
        clinician_name="Dr. Jane Smith",
        license_number="MD123456",
        licensing_jurisdiction="CA",
        clinician_role="sports_physician",
        evaluation_date=date.today(),
        clinician_declaration_signed=True,
    )
    result = validate_clinician_clearance(submission)

    assert result.is_valid is False
    assert result.verification_status == "rejected_athlete_self_report"
    assert result.clinician_clearance_granted is False
    assert result.medical_clearance_required is True
    assert any("Athlete self-reported clearance is rejected" in r for r in result.rejection_reasons)


def test_clearance_missing_license_or_jurisdiction_rejected():
    """Missing official license number or jurisdiction must reject authorization."""
    submission = ClinicianClearanceSubmission(
        attestation_type="direct_clinician_entry",
        clinician_name="Dr. Robert Taylor",
        license_number="",  # Empty
        licensing_jurisdiction="NY",
        clinician_role="orthopedic_surgeon",
        evaluation_date=date.today(),
        clinician_declaration_signed=True,
    )
    result = validate_clinician_clearance(submission)

    assert result.is_valid is False
    assert result.verification_status == "rejected_missing_credentials"
    assert result.clinician_clearance_granted is False
    assert any("license number is missing" in r for r in result.rejection_reasons)


def test_clearance_missing_signed_declaration_rejected():
    """Clearance lacking explicit signed provider declaration must be rejected."""
    submission = ClinicianClearanceSubmission(
        attestation_type="direct_clinician_entry",
        clinician_name="Dr. Robert Taylor",
        license_number="MD998877",
        licensing_jurisdiction="NY",
        clinician_role="sports_physician",
        evaluation_date=date.today(),
        clinician_declaration_signed=False,  # Unsigned
    )
    result = validate_clinician_clearance(submission)

    assert result.is_valid is False
    assert result.verification_status == "rejected_missing_declaration"
    assert result.clinician_clearance_granted is False
    assert any("Signed clinician declaration" in r for r in result.rejection_reasons)


def test_clearance_future_evaluation_date_rejected():
    """Clinical evaluation date in the future must be rejected."""
    future_date = date.today() + timedelta(days=5)
    submission = ClinicianClearanceSubmission(
        attestation_type="direct_clinician_entry",
        clinician_name="Dr. Alice Wong",
        license_number="PT554433",
        licensing_jurisdiction="TX",
        clinician_role="physical_therapist",
        evaluation_date=future_date,
        clinician_declaration_signed=True,
    )
    result = validate_clinician_clearance(submission)

    assert result.is_valid is False
    assert result.verification_status == "rejected_future_date"
    assert any("future" in r for r in result.rejection_reasons)


def test_clearance_lapsed_evaluation_date_rejected():
    """Clinical evaluation date older than 60 days must be rejected as lapsed."""
    old_date = date.today() - timedelta(days=75)
    submission = ClinicianClearanceSubmission(
        attestation_type="direct_clinician_entry",
        clinician_name="Dr. Alice Wong",
        license_number="PT554433",
        licensing_jurisdiction="TX",
        clinician_role="physical_therapist",
        evaluation_date=old_date,
        clinician_declaration_signed=True,
    )
    result = validate_clinician_clearance(submission)

    assert result.is_valid is False
    assert result.verification_status == "rejected_expired"
    assert any("lapsed" in r for r in result.rejection_reasons)


def test_clearance_authorized_clinician_passes():
    """Legitimate licensed clinician submission with signed declaration passes authorization."""
    submission = ClinicianClearanceSubmission(
        attestation_type="direct_clinician_entry",
        clinician_name="Dr. Marcus Vance, MD",
        license_number="MED-CA-892110",
        licensing_jurisdiction="California Medical Board",
        clinician_role="sports_physician",
        institution_or_clinic="Olympic Sports Medicine Center",
        evaluation_date=date.today() - timedelta(days=2),
        clinician_declaration_signed=True,
        clearance_scope="conservative_rehab_only",
    )
    result = validate_clinician_clearance(submission)

    assert result.is_valid is True
    assert result.verification_status == "verified_authorized"
    assert result.clinician_clearance_granted is True
    assert result.medical_clearance_required is False
    assert len(result.rejection_reasons) == 0


# ─────────────────────────────────────────────────────────────────────────────
# 2. Emergency Priority Triage Tests (Adjustment 7 & 1)
# ─────────────────────────────────────────────────────────────────────────────

def test_emergency_red_flag_overrides_prior_clinician_clearance():
    """Acute cauda equina signs must supersede prior clearance, forcing emergency triage."""
    presentation = AthleteClinicalPresentation(
        body_areas=["lower_back"],
        pain_severity=6,
        symptoms=["sharp back pain", "saddle anesthesia", "numbness in groin"],
        clearance_submission=ClinicianClearanceSubmission(
            attestation_type="direct_clinician_entry",
            clinician_name="Dr. Marcus Vance",
            license_number="MED-892110",
            licensing_jurisdiction="CA",
            clinician_role="sports_physician",
            evaluation_date=date.today(),
            clinician_declaration_signed=True,
        ),
    )
    response = evaluate_doctor_guidance(presentation)

    assert response.triage_level == "emergency"
    assert response.warning_signs_status == "emergency_detected"
    assert response.clearance_validation.clinician_clearance_granted is False
    assert response.clearance_validation.medical_clearance_required is True
    assert response.module3_doctor_guidance.medical_clearance_required is True
    assert response.module3_doctor_guidance.clinician_clearance_granted is False
    assert any("EMERGENCY OVERRIDE" in r for r in response.clearance_validation.rejection_reasons)


def test_emergency_guidance_fed_to_module3_strictly_withholds_exercises():
    """When Module 2 outputs emergency guidance, Module 3 withholds all recommendations."""
    presentation = AthleteClinicalPresentation(
        body_areas=["knee"],
        pain_severity=9,
        symptoms=["gross deformity", "bone protruding"],
    )
    guidance_resp = evaluate_doctor_guidance(presentation)
    assert guidance_resp.triage_level == "emergency"

    # Map directly to Module 3 ExerciseAssessmentRequest using Module 2's guidance output
    m3_request = ExerciseAssessmentRequest(
        body_areas=presentation.body_areas,
        symptoms=presentation.symptoms,
        pain_severity=presentation.pain_severity,
        doctor_guidance=guidance_resp.module3_doctor_guidance,
    )
    m3_recommendation = recommend_exercises(m3_request)

    assert m3_recommendation.status == "withheld"
    assert m3_recommendation.triage_level == "emergency"
    assert len(m3_recommendation.activities) == 0


# ─────────────────────────────────────────────────────────────────────────────
# 3. Prompt Assessment Signs Tests (Adjustment 2 & 7)
# ─────────────────────────────────────────────────────────────────────────────

def test_prompt_assessment_ottawa_non_weight_bearing_forces_clearance_block():
    """Inability to bear weight triggers prompt clinical assessment and blocks exercises."""
    presentation = AthleteClinicalPresentation(
        body_areas=["ankle"],
        pain_severity=6,
        symptoms=["inability to bear weight after twist"],
    )
    response = evaluate_doctor_guidance(presentation)

    assert response.triage_level == "prompt_medical_assessment"
    assert response.warning_signs_status == "prompt_assessment_required"
    assert response.module3_doctor_guidance.medical_clearance_required is True

    # Test integration with Module 3
    m3_request = ExerciseAssessmentRequest(
        body_areas=["ankle"],
        symptoms=["inability to bear weight after twist"],
        pain_severity=6,
        doctor_guidance=response.module3_doctor_guidance,
    )
    m3_recommendation = recommend_exercises(m3_request)
    assert m3_recommendation.status == "withheld"
    assert m3_recommendation.triage_level == "prompt_medical_assessment"
    assert len(m3_recommendation.activities) == 0


# ─────────────────────────────────────────────────────────────────────────────
# 4. Missing Information Handling Tests (Adjustment 5)
# ─────────────────────────────────────────────────────────────────────────────

def test_unassessed_warning_signs_are_not_assumed_absent():
    """When screening is omitted, status must be unassessed_incomplete_data, NOT cleared."""
    presentation = AthleteClinicalPresentation(
        body_areas=["knee"],
        pain_severity=3,
        symptoms=["mild ache after running"],
        warning_signs_screening=None,  # Missing screening
    )
    response = evaluate_doctor_guidance(presentation)

    assert response.warning_signs_status == "unassessed_incomplete_data"
    assert "screening was not performed" in response.clinical_summary


def test_explicit_negative_screening_is_cleared():
    """When screening is explicitly completed with 0 flags, status is cleared."""
    presentation = AthleteClinicalPresentation(
        body_areas=["knee"],
        pain_severity=3,
        symptoms=["mild ache after running"],
        warning_signs_screening=WarningSignsScreening(
            screening_completed=True,
            emergency_signs_present=[],
            prompt_assessment_signs_present=[],
        ),
    )
    response = evaluate_doctor_guidance(presentation)

    assert response.warning_signs_status == "cleared"


# ─────────────────────────────────────────────────────────────────────────────
# 5. Contradiction Detection Tests (Adjustment 5)
# ─────────────────────────────────────────────────────────────────────────────

def test_contradiction_high_pain_vs_asymptomatic():
    """Severe pain (VAS 9) combined with claiming 'no symptoms' is flagged as contradictory."""
    presentation = AthleteClinicalPresentation(
        body_areas=["shoulder"],
        pain_severity=9,
        symptoms=["asymptomatic", "no pain"],
    )
    response = evaluate_doctor_guidance(presentation)

    assert len(response.contradictions_detected) > 0
    assert any("Severe pain rating" in c for c in response.contradictions_detected)


def test_contradiction_athlete_self_report_with_signature_claim():
    """Athlete self-report containing provider declaration claim is flagged as contradictory."""
    presentation = AthleteClinicalPresentation(
        body_areas=["knee"],
        pain_severity=4,
        clearance_submission=ClinicianClearanceSubmission(
            attestation_type="athlete_self_report",
            clinician_declaration_signed=True,
        ),
    )
    response = evaluate_doctor_guidance(presentation)

    assert any("declaration signature claim" in c for c in response.contradictions_detected)


# ─────────────────────────────────────────────────────────────────────────────
# 6. Restriction Codes & Movement Tags Contract Tests (Adjustment 4 & 8)
# ─────────────────────────────────────────────────────────────────────────────

def test_patellofemoral_rule_triggers_exact_module3_restriction_codes():
    """Patellofemoral symptoms trigger RESTRICT_DEEP_FLEXION and movement tags."""
    presentation = AthleteClinicalPresentation(
        body_areas=["knee"],
        pain_severity=4,
        symptoms=["anterior knee pain", "patellar tendon ache"],
        warning_signs_screening=WarningSignsScreening(screening_completed=True),
    )
    response = evaluate_doctor_guidance(presentation)

    assert "RESTRICT_DEEP_FLEXION" in response.active_restriction_codes
    assert "deep_knee_flexion" in response.active_disallowed_movement_tags
    assert "partial_flexion" in response.active_disallowed_movement_tags
    assert response.module3_doctor_guidance.restriction_codes == ["RESTRICT_DEEP_FLEXION"]

    # Module 3 integration: deep flexion exercises must be excluded
    m3_request = ExerciseAssessmentRequest(
        body_areas=["knee"],
        symptoms=["patellar tendon ache"],
        pain_severity=4,
        doctor_guidance=response.module3_doctor_guidance,
    )
    m3_recommendation = recommend_exercises(m3_request)
    assert m3_recommendation.status == "recommended"
    # Ensure no recommended knee activity has disallowed deep/partial flexion tags
    for act in m3_recommendation.activities:
        # None of the recommended activities should be tagged with restricted movements
        assert getattr(act, "movement_tags", None) is None or not any(
            t in ["deep_knee_flexion", "partial_flexion"] for t in getattr(act, "movement_tags", [])
        )


def test_shoulder_impingement_triggers_overhead_restriction():
    """Shoulder impingement symptoms trigger RESTRICT_OVERHEAD and gentle intensity ceiling."""
    presentation = AthleteClinicalPresentation(
        body_areas=["shoulder"],
        pain_severity=4,
        symptoms=["subacromial impingement", "overhead pain"],
        warning_signs_screening=WarningSignsScreening(screening_completed=True),
    )
    response = evaluate_doctor_guidance(presentation)

    assert "RESTRICT_OVERHEAD" in response.active_restriction_codes
    assert "overhead_press" in response.active_disallowed_movement_tags
    assert "overhead_mobility" in response.active_disallowed_movement_tags
    assert response.effective_max_intensity == "gentle"

    # Module 3 integration: overhead mobility exercises must be excluded
    m3_request = ExerciseAssessmentRequest(
        body_areas=["shoulder"],
        symptoms=["subacromial impingement"],
        pain_severity=4,
        doctor_guidance=response.module3_doctor_guidance,
    )
    m3_recommendation = recommend_exercises(m3_request)
    assert m3_recommendation.status == "recommended"
    for act in m3_recommendation.activities:
        assert act.id != "shoulder-scapular-wall-slide"


def test_clinician_prescribed_restrictions_are_merged():
    """Clinician-directed restrictions are seamlessly incorporated into active restrictions."""
    presentation = AthleteClinicalPresentation(
        body_areas=["lower_back"],
        pain_severity=3,
        clinician_prescribed_restrictions=["RESTRICT_AXIAL_LOAD"],
        warning_signs_screening=WarningSignsScreening(screening_completed=True),
    )
    response = evaluate_doctor_guidance(presentation)

    assert "RESTRICT_AXIAL_LOAD" in response.active_restriction_codes
    assert "axial_load" in response.active_disallowed_movement_tags
    assert "heavy_load" in response.active_disallowed_movement_tags


# ─────────────────────────────────────────────────────────────────────────────
# 7. Clinical Review Status Separation Tests (Adjustment 6)
# ─────────────────────────────────────────────────────────────────────────────

def test_pending_review_rules_are_not_automatically_applied():
    """Rules with review_status 'pending_review' must NOT activate automated restrictions."""
    presentation = AthleteClinicalPresentation(
        body_areas=["neck"],
        pain_severity=3,
        symptoms=["neck stiffness"],
        warning_signs_screening=WarningSignsScreening(screening_completed=True),
    )
    response = evaluate_doctor_guidance(presentation)

    # Experimental neck rule is 'pending_review'
    skipped_rule_ids = [r.rule_id for r in response.pending_review_rules_skipped]
    assert "RULE_EXPERIMENTAL_CERVICAL_ISOMETRIC" in skipped_rule_ids
    # Its restriction RESTRICT_ROTATION should NOT be active
    assert "RESTRICT_ROTATION" not in response.active_restriction_codes
    assert len(response.applied_guidance_rules) == 0


def test_all_guidance_rules_have_valid_citations_and_evidence():
    """Every rule in CLINICAL_GUIDANCE_RULES must have a detailed clinical citation."""
    rules = get_all_guidance_rules(approved_only=False)
    assert len(rules) >= 5

    for rule in rules:
        assert len(rule.clinical_citation.strip()) > 15
        assert len(rule.evidence_summary.strip()) > 10
        assert rule.review_status in ["approved", "pending_review"]


# ─────────────────────────────────────────────────────────────────────────────
# 8. Severe Pain (VAS >= 8) Management Tests
# ─────────────────────────────────────────────────────────────────────────────

def test_severe_pain_without_clearance_withheld():
    """Severe pain (VAS 8) without verified clearance blocks unguided exercise."""
    presentation = AthleteClinicalPresentation(
        body_areas=["knee"],
        pain_severity=8,
        symptoms=["severe knee pain"],
        warning_signs_screening=WarningSignsScreening(screening_completed=True),
    )
    response = evaluate_doctor_guidance(presentation)

    assert response.triage_level == "prompt_medical_assessment"
    assert response.module3_doctor_guidance.medical_clearance_required is True


def test_severe_pain_with_authorized_clearance_allows_conservative_guidance():
    """Severe pain (VAS 8) WITH authorized clearance allows conservative gentle guidance."""
    presentation = AthleteClinicalPresentation(
        body_areas=["knee"],
        pain_severity=8,
        symptoms=["persistent knee ache under care"],
        warning_signs_screening=WarningSignsScreening(screening_completed=True),
        clearance_submission=ClinicianClearanceSubmission(
            attestation_type="direct_clinician_entry",
            clinician_name="Dr. Sarah Jenkins",
            license_number="PT-40912",
            licensing_jurisdiction="IL",
            clinician_role="physical_therapist",
            evaluation_date=date.today() - timedelta(days=1),
            clinician_declaration_signed=True,
            clearance_scope="conservative_rehab_only",
        ),
    )
    response = evaluate_doctor_guidance(presentation)

    assert response.triage_level == "standard_monitoring"
    assert response.clearance_validation.clinician_clearance_granted is True
    assert response.effective_max_intensity == "gentle"
    assert response.module3_doctor_guidance.clinician_clearance_granted is True
    assert response.module3_doctor_guidance.medical_clearance_required is False

    # Module 3 integration
    m3_request = ExerciseAssessmentRequest(
        body_areas=["knee"],
        symptoms=["persistent knee ache under care"],
        pain_severity=8,
        doctor_guidance=response.module3_doctor_guidance,
    )
    m3_rec = recommend_exercises(m3_request)
    assert m3_rec.status == "conservative_guidance"
    assert m3_rec.triage_level == "standard_monitoring"
    assert len(m3_rec.activities) > 0


# ─────────────────────────────────────────────────────────────────────────────
# 9. FastAPI HTTP Route Tests
# ─────────────────────────────────────────────────────────────────────────────

def test_api_evaluate_endpoint(client: TestClient):
    payload = {
        "body_areas": ["shoulder"],
        "pain_severity": 3,
        "symptoms": ["rotator cuff ache"],
        "warning_signs_screening": {
            "screening_completed": True,
            "emergency_signs_present": [],
            "prompt_assessment_signs_present": [],
        },
    }
    response = client.post("/api/v1/doctor-guidance/evaluate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["triage_level"] == "standard_monitoring"
    assert "RESTRICT_OVERHEAD" in data["active_restriction_codes"]
    assert "module3_doctor_guidance" in data


def test_api_safety_check_endpoint(client: TestClient):
    payload = {
        "body_areas": ["lower_back"],
        "pain_severity": 5,
        "symptoms": ["numbness in groin", "loss of bowel"],
    }
    response = client.post("/api/v1/doctor-guidance/safety-check", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["triage_level"] == "emergency"
    assert data["warning_signs_status"] == "emergency_detected"


def test_api_clearance_validation_endpoint(client: TestClient):
    payload = {
        "attestation_type": "athlete_self_report",
        "clinician_name": "Dr. Self",
        "clinician_declaration_signed": True,
    }
    response = client.post("/api/v1/doctor-guidance/clearance/validate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["is_valid"] is False
    assert data["verification_status"] == "rejected_athlete_self_report"


def test_api_list_rules_endpoint(client: TestClient):
    response = client.get("/api/v1/doctor-guidance/rules?approved_only=true")
    assert response.status_code == 200
    rules = response.json()
    assert len(rules) >= 4
    for r in rules:
        assert r["review_status"] == "approved"


def test_api_list_restrictions_endpoint(client: TestClient):
    response = client.get("/api/v1/doctor-guidance/restrictions")
    assert response.status_code == 200
    items = response.json()
    codes = [item["code"] for item in items]
    assert "RESTRICT_DEEP_FLEXION" in codes
    assert "RESTRICT_OVERHEAD" in codes
    assert "RESTRICT_AXIAL_LOAD" in codes


def test_api_doctor_guidance_health_endpoint(client: TestClient):
    response = client.get("/api/v1/doctor-guidance/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "doctor-guidance"
    assert data["rules_count"] >= 5
