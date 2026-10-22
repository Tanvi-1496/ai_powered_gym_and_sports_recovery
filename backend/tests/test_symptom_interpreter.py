"""Automated test suite for Gemini AI symptom and body-area interpretation.

Tests:
1. Common body areas and anatomical synonyms.
2. Left, right, and bilateral symptoms.
3. Multiple body areas in one description.
4. Ambiguous descriptions and clarification requests.
5. Empty input and malformed model output.
6. API timeout, quota exhaustion, and provider failure handling.
7. Correct deterministic fallback behavior.
8. Independent emergency red-flag screening.
9. FastAPI endpoint integration (/api/v1/symptoms/interpret).
"""

from unittest.mock import MagicMock, patch
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.schemas.symptoms import (
    SymptomInterpretationRequest,
    SymptomInterpretationResponse,
)
from app.services.symptom_interpreter import (
    interpret_symptom,
    interpret_symptom_deterministic,
    _INTERPRETATION_CACHE,
)


@pytest.fixture(autouse=True)
def clear_interpreter_cache():
    """Ensure in-memory cache is cleared before each test."""
    _INTERPRETATION_CACHE.clear()
    yield
    _INTERPRETATION_CACHE.clear()


@pytest.fixture
def client():
    return TestClient(app)


# ── 1. COMMON BODY AREAS AND SYNONYMS (DETERMINISTIC FALLBACK & LOGIC) ───

def test_deterministic_knee_and_patella():
    """Test recognition of knee and its synonyms in deterministic mode."""
    res1 = interpret_symptom_deterministic("sharp pain in patellar tendon when jumping")
    assert res1.primary_body_area == "knee"
    assert "knee" in res1.canonical_body_areas
    assert res1.items[0].symptom_type == "pain"
    assert res1.items[0].anatomical_structure == "patellar tendon"

    res2 = interpret_symptom_deterministic("runner's knee soreness")
    assert res2.primary_body_area == "knee"


def test_deterministic_shoulder_and_rotator_cuff():
    """Test recognition of shoulder and rotator cuff in deterministic mode."""
    res = interpret_symptom_deterministic("rotator cuff impingement pain")
    assert res.primary_body_area == "shoulder"
    assert res.items[0].anatomical_structure == "rotator cuff"


def test_deterministic_achilles_and_ankle():
    """Test recognition of Achilles tendon and ankle zone."""
    res = interpret_symptom_deterministic("tightness in Achilles tendon after running")
    assert res.primary_body_area == "ankle"
    assert res.items[0].symptom_type == "stiffness"
    assert "Achilles" in res.items[0].anatomical_structure


# ── 2. LATERALITY: LEFT, RIGHT, BILATERAL ──────────────────────────────

def test_laterality_detection():
    """Test identification of left, right, bilateral, and center sides."""
    res_left = interpret_symptom_deterministic("left shoulder pain")
    assert res_left.items[0].side == "left"
    assert res_left.items[0].matched_manifest_id == "left-shoulder"

    res_right = interpret_symptom_deterministic("right knee stiffness")
    assert res_right.items[0].side == "right"
    assert res_right.items[0].matched_manifest_id == "right-knee"

    res_bilat = interpret_symptom_deterministic("both knees ache after squats")
    assert res_bilat.items[0].side == "bilateral"
    assert res_bilat.items[0].matched_manifest_id == "knees"

    res_center = interpret_symptom_deterministic("pain in central spine and lower back")
    assert res_center.items[0].side == "center"


# ── 3. AMBIGUOUS INPUTS AND CLARIFICATION REQUESTS ─────────────────────

def test_ambiguous_description_requests_clarification():
    """Test that vague descriptions request clarification without hallucinating an area."""
    res = interpret_symptom_deterministic("it hurts")
    assert res.needs_clarification is True
    assert res.status == "clarification_needed"
    assert res.clarifying_question is not None
    assert "joint or muscle" in res.clarifying_question.lower()


def test_empty_input_handling():
    """Test handling of empty or whitespace-only input."""
    res = interpret_symptom_deterministic("   ")
    assert res.primary_body_area == "general"
    assert res.needs_clarification is True


# ── 4. EMERGENCY RED FLAG PRESERVATION (CLINICAL SAFETY) ───────────────

def test_emergency_red_flags_detected_independently():
    """Verify red-flag clinical alerts fire regardless of LLM availability."""
    res_chest = interpret_symptom_deterministic("chest pain with shortness of breath while lifting")
    assert res_chest.red_flag_warning is not None
    assert "Emergency Indicator Detected" in res_chest.red_flag_warning

    res_cold = interpret_symptom_deterministic("cold pale limb and numbness in foot")
    assert res_cold.red_flag_warning is not None
    assert "distal perfusion deficit" in res_cold.red_flag_warning.lower() or "emergency" in res_cold.red_flag_warning.lower()

    res_weight = interpret_symptom_deterministic("inability to bear weight on ankle after landing")
    assert res_weight.red_flag_warning is not None
    assert "Prompt Assessment" in res_weight.red_flag_warning


# ── 5. MOCKED GEMINI AI INTERPRETATION SUCCESS ─────────────────────────

def test_mocked_gemini_success():
    """Test full successful interpretation flow with a mocked Gemini client."""
    mock_json_response = """{
      "items": [
        {
          "body_area": "shoulder",
          "canonical_body_area": "shoulder",
          "side": "left",
          "symptom_type": "pain",
          "trigger": "raising arm above head",
          "anatomical_structure": "unknown",
          "duration": null,
          "confidence": 0.95,
          "matched_manifest_id": "left-shoulder"
        }
      ],
      "primary_body_area": "shoulder",
      "needs_clarification": false,
      "clarifying_question": null,
      "reasoning": "Athlete described left shoulder pain triggered by overhead arm elevation."
    }"""

    mock_client = MagicMock()
    mock_model_response = MagicMock()
    mock_model_response.text = mock_json_response
    mock_client.models.generate_content.return_value = mock_model_response

    with patch("app.services.symptom_interpreter._get_gemini_client", return_value=mock_client):
        req = SymptomInterpretationRequest(
            text="My left shoulder hurts when I raise my arm above my head.",
            sport="weightlifting",
        )
        res = interpret_symptom(req)

        assert res.status == "success"
        assert res.is_fallback is False
        assert res.primary_body_area == "shoulder"
        assert len(res.items) == 1
        assert res.items[0].side == "left"
        assert res.items[0].trigger == "raising arm above head"
        assert res.items[0].anatomical_structure == "unknown"
        assert res.items[0].matched_manifest_id == "left-shoulder"
        assert res.needs_clarification is False


def test_mocked_gemini_multiple_body_areas():
    """Test model recognizing multiple body areas in one natural-language sentence."""
    mock_json_response = """{
      "items": [
        {
          "body_area": "shoulder",
          "canonical_body_area": "shoulder",
          "side": "left",
          "symptom_type": "pain",
          "trigger": "bench press",
          "anatomical_structure": "unknown",
          "duration": "3 days",
          "confidence": 0.92,
          "matched_manifest_id": "left-shoulder"
        },
        {
          "body_area": "knee",
          "canonical_body_area": "knee",
          "side": "right",
          "symptom_type": "stiffness",
          "trigger": "squats",
          "anatomical_structure": "unknown",
          "duration": "1 week",
          "confidence": 0.90,
          "matched_manifest_id": "right-knee"
        }
      ],
      "primary_body_area": "shoulder",
      "needs_clarification": false,
      "clarifying_question": null,
      "reasoning": "Identified bilateral symptoms affecting left shoulder and right knee."
    }"""

    mock_client = MagicMock()
    mock_model_response = MagicMock()
    mock_model_response.text = mock_json_response
    mock_client.models.generate_content.return_value = mock_model_response

    with patch("app.services.symptom_interpreter._get_gemini_client", return_value=mock_client):
        req = SymptomInterpretationRequest(
            text="My left shoulder has pain from bench press, and my right knee is stiff from squats.",
        )
        res = interpret_symptom(req)

        assert res.status == "success"
        assert len(res.items) == 2
        assert set(res.canonical_body_areas) == {"shoulder", "knee"}
        assert "left-shoulder" in res.manifest_part_ids
        assert "right-knee" in res.manifest_part_ids


# ── 6. PROVIDER FAILURES, TIMEOUTS, QUOTA, AND MALFORMED RESPONSES ────

def test_gemini_timeout_graceful_fallback():
    """Verify that ServerError/Timeout falls back to deterministic rules seamlessly."""
    mock_client = MagicMock()
    mock_client.models.generate_content.side_effect = TimeoutError("Deadline exceeded")

    with patch("app.services.symptom_interpreter._get_gemini_client", return_value=mock_client):
        req = SymptomInterpretationRequest(text="Left knee swelling after running")
        res = interpret_symptom(req)

        assert res.status == "fallback"
        assert res.is_fallback is True
        assert res.primary_body_area == "knee"
        assert res.items[0].side == "left"
        assert res.items[0].symptom_type == "swelling"


def test_gemini_malformed_json_fallback():
    """Verify that corrupt or non-JSON output from provider does not crash the service."""
    mock_client = MagicMock()
    mock_model_response = MagicMock()
    mock_model_response.text = "Sorry, as an AI I am unable to format this as JSON: [Error 500]"
    mock_client.models.generate_content.return_value = mock_model_response

    with patch("app.services.symptom_interpreter._get_gemini_client", return_value=mock_client):
        req = SymptomInterpretationRequest(text="Lower back pain when bending forward")
        res = interpret_symptom(req)

        assert res.is_fallback is True
        assert res.primary_body_area == "lower_back"
        assert res.items[0].trigger == "spinal flexion / bending forward"


# ── 7. FASTAPI HTTP ROUTE ENDPOINT INTEGRATION ─────────────────────────

def test_api_symptom_interpret_endpoint(client):
    """Test POST /api/v1/symptoms/interpret via TestClient."""
    response = client.post(
        "/api/v1/symptoms/interpret",
        json={
            "text": "My right shoulder hurts during overhead press",
            "sport": "crossfit",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert "raw_text" in data
    assert "items" in data
    assert data["primary_body_area"] in ["shoulder", "general"]
    assert "clinical_notice" in data


def test_api_symptom_status_endpoint(client):
    """Test GET /api/v1/symptoms/status configuration check."""
    response = client.get("/api/v1/symptoms/status")
    assert response.status_code == 200
    data = response.json()
    assert data["service"] == "symptom-interpreter"
    assert "gemini_available" in data
    assert "diagnostic_disclaimer" in data
