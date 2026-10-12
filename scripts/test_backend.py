import os
import sys

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from backend.app.main import app

def test_api():
    print("=== TESTING FASTAPI BACKEND ENDPOINTS ===")
    client = TestClient(app)
    
    # 1. Health
    r = client.get("/health")
    print(f"GET /health: status={r.status_code}, data={r.json()['status']}")
    assert r.status_code == 200
    
    # 2. Models Leaderboard
    r = client.get("/api/models")
    print(f"GET /api/models: status={r.status_code}, best_model={r.json()['best_model']}, models_count={len(r.json()['leaderboard'])}")
    assert r.status_code == 200
    
    # 3. Predict (24 hours)
    r = client.post("/api/predict", json={"model_name": "Bi-LSTM", "horizon": 24, "start_offset": 0})
    print(f"POST /api/predict: status={r.status_code}, points={len(r.json()['forecast'])}, summary={r.json()['summary_metrics']}")
    assert r.status_code == 200
    
    # 4. Dataset Stats
    r = client.get("/api/dataset/stats")
    print(f"GET /api/dataset/stats: status={r.status_code}, total_records={r.json()['total_records']}")
    assert r.status_code == 200
    
    # 5. Dataset Explorer (paginated)
    r = client.get("/api/dataset?page=1&page_size=5")
    print(f"GET /api/dataset: status={r.status_code}, records={len(r.json()['records'])}, total_pages={r.json()['total_pages']}")
    assert r.status_code == 200
    
    # 6. Analytics
    r = client.get("/api/analytics")
    print(f"GET /api/analytics: status={r.status_code}, hourly_pts={len(r.json()['hourly_profile'])}, monthly_pts={len(r.json()['monthly_trend'])}")
    assert r.status_code == 200
    
    print("\nALL FASTAPI BACKEND ENDPOINTS PASSED VERIFICATION!")

if __name__ == '__main__':
    test_api()
