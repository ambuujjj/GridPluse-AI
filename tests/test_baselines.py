import json
import os


def test_leaderboard_contains_all_baselines_and_benchmarks():
    """Verifies that leaderboard.json contains all required baselines and benchmarks."""
    leaderboard_file = os.path.join("backend", "artifacts", "leaderboard.json")
    assert os.path.exists(leaderboard_file), "leaderboard.json does not exist!"

    with open(leaderboard_file) as f:
        data = json.load(f)

    assert data["best_model"] == "Bi-LSTM"
    models = {m["model_name"]: m for m in data["leaderboard"]}

    required_names = [
        "Persistence Baseline",
        "Seasonal Naive (24h)",
        "Seasonal Naive (168h)",
        "Grid Operator Forecast",
        "Bi-LSTM",
        "GRU",
        "LSTM",
        "CNN-LSTM"
    ]
    for name in required_names:
        assert name in models, f"Missing {name} from leaderboard!"

def test_persistence_baseline_scientific_range():
    """
    Scientific check: The true 1-hour persistence baseline on Spain load
    must have a MAPE in the realistic range [3.0%, 4.5%], NOT ~30%.
    """
    with open(os.path.join("backend", "artifacts", "leaderboard.json")) as f:
        data = json.load(f)
    models = {m["model_name"]: m for m in data["leaderboard"]}

    persistence = models["Persistence Baseline"]
    assert 3.0 <= persistence["mape"] <= 4.5, (
        f"Persistence MAPE ({persistence['mape']}%) is outside valid scientific range [3.0%, 4.5%]"
    )
    assert persistence["r2"] > 0.85, (
        f"Persistence R2 ({persistence['r2']}) should be > 0.85 due to high 1h autocorrelation"
    )

def test_seasonal_naive_baselines_scientific_range():
    """Scientific check: Seasonal Naive daily (~8.7%) and weekly (~9.0%) baselines."""
    with open(os.path.join("backend", "artifacts", "leaderboard.json")) as f:
        data = json.load(f)
    models = {m["model_name"]: m for m in data["leaderboard"]}

    sn24 = models["Seasonal Naive (24h)"]
    assert 7.0 <= sn24["mape"] <= 10.0, f"Seasonal Naive 24h MAPE {sn24['mape']}% outside expected range"

    sn168 = models["Seasonal Naive (168h)"]
    assert 7.5 <= sn168["mape"] <= 11.0, f"Seasonal Naive 168h MAPE {sn168['mape']}% outside expected range"

def test_champion_deep_learning_beats_baselines():
    """Verifies that Bi-LSTM outperforms persistence and seasonal naive baselines."""
    with open(os.path.join("backend", "artifacts", "leaderboard.json")) as f:
        data = json.load(f)
    models = {m["model_name"]: m for m in data["leaderboard"]}

    bilstm = models["Bi-LSTM"]
    persistence = models["Persistence Baseline"]
    sn24 = models["Seasonal Naive (24h)"]

    # Bi-LSTM must beat persistence (2.78% vs 3.69%)
    assert bilstm["mape"] < persistence["mape"]
    # Bi-LSTM must significantly beat seasonal naive (2.78% vs 8.73%)
    assert bilstm["mape"] < sn24["mape"]
    assert bilstm["r2"] > persistence["r2"]
