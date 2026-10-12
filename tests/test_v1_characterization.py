import pytest
from fastapi.testclient import TestClient

from backend.app.main import app


@pytest.fixture(scope="module")
def client():
    return TestClient(app)

def test_system_health(client):
    """Characterisation: Verify GET /health reports operational state and model availability."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "operational"
    assert data["api_version"] == "1.0.0"
    assert "TensorFlow" in data["framework"]
    assert data["total_models_available"] >= 4
    assert data["best_model_loaded"] is True

def test_models_leaderboard(client):
    """Characterisation: Verify GET /api/models returns leaderboard and champion model."""
    response = client.get("/api/models")
    assert response.status_code == 200
    data = response.json()
    assert data["best_model"] == "Bi-LSTM"
    assert isinstance(data["leaderboard"], list)
    assert len(data["leaderboard"]) >= 5

    # Confirm key metric keys exist on every model item
    for item in data["leaderboard"]:
        assert "model_name" in item
        assert "mae" in item
        assert "rmse" in item
        assert "mape" in item
        assert "r2" in item

def test_predict_endpoint_default(client):
    """Characterisation: Verify POST /api/predict returns 24-point forecast with bounds."""
    payload = {"model_name": "Bi-LSTM", "horizon": 24, "start_offset": 0}
    response = client.post("/api/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["model_used"] == "Bi-LSTM"
    assert data["horizon"] == 24
    assert len(data["forecast"]) == 24

    first_point = data["forecast"][0]
    assert "timestamp" in first_point
    assert "predicted_load" in first_point
    assert "lower_bound" in first_point
    assert "upper_bound" in first_point
    assert first_point["lower_bound"] <= first_point["predicted_load"] <= first_point["upper_bound"]

    # Summary metrics sanity
    summary = data["summary_metrics"]
    assert summary["mape"] > 0
    assert summary["avg_load_mw"] > 10000

def test_predict_custom_model_and_horizon(client):
    """Characterisation: Verify prediction with GRU model over 48 hours."""
    payload = {"model_name": "GRU", "horizon": 48, "start_offset": 10}
    response = client.post("/api/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["horizon"] == 48
    assert len(data["forecast"]) == 48

def test_dataset_stats(client):
    """Characterisation: Verify GET /api/dataset/stats returns Spain dataset metadata."""
    response = client.get("/api/dataset/stats")
    assert response.status_code == 200
    data = response.json()
    assert data["total_records"] == 35064
    assert data["target_variable"] == "total load actual"
    assert data["mean_load"] > 20000
    assert len(data["features_list"]) >= 25

def test_dataset_paginated(client):
    """Characterisation: Verify GET /api/dataset pagination and structure."""
    response = client.get("/api/dataset?page=1&page_size=10")
    assert response.status_code == 200
    data = response.json()
    assert data["page"] == 1
    assert data["page_size"] == 10
    assert data["total_records"] == 35064
    assert len(data["records"]) == 10

def test_analytics_endpoint(client):
    """Characterisation: Verify GET /api/analytics returns diurnal and seasonal aggregates."""
    response = client.get("/api/analytics")
    assert response.status_code == 200
    data = response.json()
    assert "hourly_profile" in data
    assert len(data["hourly_profile"]) == 24
    assert "monthly_trend" in data
    assert len(data["monthly_trend"]) == 12
    assert "temp_vs_load" in data
    assert "correlation_matrix" in data
    assert "renewable_mix" in data

def test_train_endpoint_backward_compat(client):
    """Characterisation: Verify POST /api/train preserves backward-compatible response."""
    payload = {
        "model_type": "LSTM",
        "epochs": 2,
        "batch_size": 128,
        "learning_rate": 0.001
    }
    response = client.post("/api/train", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "completed"
    assert data["model_type"] == "LSTM"
    assert "metrics" in data
