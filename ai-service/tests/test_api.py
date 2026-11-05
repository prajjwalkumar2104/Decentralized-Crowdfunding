"""
test_api.py — API Integration Tests

Tests all FastAPI routes, status codes, input validation, and score bounds.
"""

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["model_loaded"] is True
    assert "version" in data


def test_prediction_valid_request():
    payload = {
        "campaign_id": "test-123",
        "funding_progress": 0.5,
        "contributor_count": 10,
        "unique_contributor_count": 10,
        "avg_contribution_eth": 0.05,
        "contribution_std_eth": 0.02,
        "top_contributor_share": 0.20,
        "milestone_count": 3,
        "milestone_completion_ratio": 0.33,
        "milestone_vote_participation": 0.40,
        "is_cancelled": 0,
        "days_until_deadline": 25.0,
        "creator_campaign_count": 1,
    }
    response = client.post("/api/risk-score", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["campaign_id"] == "test-123"
    assert 0 <= data["risk_score"] <= 100
    assert data["risk_category"] in ["LOW", "MEDIUM", "HIGH"]
    assert isinstance(data["signals"], list)
    assert len(data["signals"]) > 0
    assert "disclaimer" in data


def test_prediction_missing_required_field():
    # Omitting top_contributor_share
    payload = {
        "campaign_id": "invalid-req",
        "funding_progress": 0.5,
        "contributor_count": 10,
        # missing top_contributor_share
    }
    response = client.post("/api/risk-score", json=payload)
    assert response.status_code == 422  # Pydantic validation error


def test_prediction_negative_contributor_count():
    # contributor_count cannot be negative
    payload = {
        "funding_progress": 0.5,
        "contributor_count": -5,
        "unique_contributor_count": 5,
        "avg_contribution_eth": 0.05,
        "contribution_std_eth": 0.02,
        "top_contributor_share": 0.20,
        "milestone_count": 3,
        "milestone_completion_ratio": 0.33,
        "milestone_vote_participation": 0.40,
        "is_cancelled": 0,
        "days_until_deadline": 25.0,
        "creator_campaign_count": 1,
    }
    response = client.post("/api/risk-score", json=payload)
    assert response.status_code == 422


def test_prediction_invalid_top_contributor_share():
    # top_contributor_share cannot exceed 1.0 (100%)
    payload = {
        "funding_progress": 0.5,
        "contributor_count": 10,
        "unique_contributor_count": 10,
        "avg_contribution_eth": 0.05,
        "contribution_std_eth": 0.02,
        "top_contributor_share": 1.5,  # Invalid: > 1.0
        "milestone_count": 3,
        "milestone_completion_ratio": 0.33,
        "milestone_vote_participation": 0.40,
        "is_cancelled": 0,
        "days_until_deadline": 25.0,
        "creator_campaign_count": 1,
    }
    response = client.post("/api/risk-score", json=payload)
    assert response.status_code == 422
