import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_predict_injury_risk_valid():
    """Verify standard biomechanical risk evaluation."""
    payload = {
        "body_areas": ["knee"],
        "symptoms": ["patellar tendon ache"],
        "pain_severity": 4,
        "duration": "1-3_days",
        "movement_limitations": ["cannot squat past 90 degrees"],
    }
    response = client.post("/api/v1/injury-risk/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["predictedRiskArea"] == "Knee"
    assert data["riskLevel"] in ["low", "moderate", "elevated", "high"]
    assert 0 <= data["riskScore"] <= 100
    assert len(data["contributingFactors"]) >= 1
    assert "cannot squat past 90 degrees" in str(data["contributingFactors"])
    assert data["modelMetadata"]["distinctFromRecoveryScore"] is True


def test_predict_injury_risk_severe_pain():
    """Verify severe pain triage output."""
    payload = {
        "body_areas": ["shoulder"],
        "symptoms": ["acute rotator cuff tear feeling"],
        "pain_severity": 9,
        "duration": "1-3_days",
    }
    response = client.post("/api/v1/injury-risk/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["riskLevel"] == "high"
    assert data["riskScore"] >= 75
    factors = [f["name"] for f in data["contributingFactors"]]
    assert any("Severe localized pain" in f for f in factors)


def test_predict_injury_risk_mild_pain():
    """Verify mild soreness produces low strain evaluation."""
    payload = {
        "body_areas": ["ankle"],
        "symptoms": ["slight post-run tightness"],
        "pain_severity": 1,
    }
    response = client.post("/api/v1/injury-risk/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["riskLevel"] == "low"
    assert data["riskScore"] <= 30


def test_predict_injury_risk_acwr_workload():
    """Verify acute-to-chronic workload spike detection."""
    payload = {
        "body_areas": ["hamstring"],
        "pain_severity": 5,
        "acwr": 1.65,
        "training_intensity": 9.0,
    }
    response = client.post("/api/v1/injury-risk/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    factors = [f["name"] for f in data["contributingFactors"]]
    assert any("ACWR" in f for f in factors)
    assert any("intensity" in f.lower() for f in factors)


def test_predict_injury_risk_empty_inputs():
    """Verify safe fallback for empty/omitted payload fields."""
    response = client.post("/api/v1/injury-risk/predict", json={})
    assert response.status_code == 200
    data = response.json()
    assert data["predictedRiskArea"] == "General Kinetic Chain"
    assert data["riskLevel"] is not None
    assert data["status"] in ["completed", "pending_model_integration"]


def test_predict_injury_risk_invalid_pain_range():
    """Verify input validation rejection for out-of-bounds pain score."""
    response = client.post("/api/v1/injury-risk/predict", json={"pain_severity": 15})
    assert response.status_code == 422

    response_neg = client.post("/api/v1/injury-risk/predict", json={"pain_severity": -2})
    assert response_neg.status_code == 422


def test_model_info_endpoint():
    """Verify transparency and evaluation metric disclosure."""
    response = client.get("/api/v1/injury-risk/model-info")
    assert response.status_code == 200
    data = response.json()
    assert "ExtraTreesRegressor" in data["model_type"]
    assert "recovery_score_mae" in data["evaluation_metrics"]
    assert data["evaluation_metrics"]["recovery_score_mae"] > 0
    assert len(data["limitations"]) >= 2
    assert "not approved as medical diagnostic devices" in data["clinical_validation_status"].lower()


def test_injury_risk_health_endpoint():
    """Verify operational health check."""
    response = client.get("/api/v1/injury-risk/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "injury-risk"
