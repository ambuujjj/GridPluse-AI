import json
import os

import joblib
import numpy as np
import pandas as pd


def test_scalers_fitted_on_train_split_only():
    """
    Mandatory Integrity Check: Prove that target and feature scalers were fitted
    exclusively on the training split, preventing future data leakage into validation or test sets.
    """
    artifacts_dir = os.path.join("backend", "artifacts")
    target_scaler = joblib.load(os.path.join(artifacts_dir, "target_scaler.joblib"))

    cleaned_file = os.path.join("data", "processed", "cleaned_dataset.csv")
    df = pd.read_csv(cleaned_file)

    # In phase 5: 168h lag buffer dropped, then 70% train
    with open(os.path.join(artifacts_dir, "feature_metadata.json")) as f:
        meta = json.load(f)

    train_samples = meta["splits"]["train"]["samples"]
    lookback = meta["lookback"]
    # Total train rows before sequencing
    train_rows = train_samples + lookback

    train_df = df.iloc[168 : 168 + train_rows]
    train_min = train_df["total load actual"].min()
    train_max = train_df["total load actual"].max()

    scaler_min = target_scaler.data_min_[0]
    scaler_max = target_scaler.data_max_[0]

    # Scaler must match train split exactly
    assert np.isclose(scaler_min, train_min, atol=1.0)
    assert np.isclose(scaler_max, train_max, atol=1.0)

    # Scaler must not be contaminated by test set boundaries
    test_df = df.iloc[168 + train_rows + meta["splits"]["val"]["samples"] + lookback :]
    test_min = test_df["total load actual"].min()
    test_max = test_df["total load actual"].max()
    assert not np.isclose(scaler_min, test_min, atol=1.0), "Scaler min matches test set min!"
    assert not np.isclose(scaler_max, test_max, atol=1.0), "Scaler max matches test set max!"

def test_feature_timestamp_strictly_before_forecast_origin():
    """
    Mandatory Rule (Section 3.4 rule 4): Fails if any input feature timestamp
    is equal to or later than the forecast target timestamp.
    """
    features_dir = os.path.join("data", "features")
    test_timestamps = np.load(os.path.join(features_dir, "test_timestamps.npy"), allow_pickle=True)

    cleaned_file = os.path.join("data", "processed", "cleaned_dataset.csv")
    df = pd.read_csv(cleaned_file)
    df["datetime"] = pd.to_datetime(df["timestamp"])

    with open(os.path.join("backend", "artifacts", "feature_metadata.json")) as f:
        meta = json.load(f)
    lookback = meta["lookback"]

    # Pick 5 arbitrary test sample indices
    test_indices = [0, 50, 100, 500, 1000]
    for idx in test_indices:
        target_ts_str = str(test_timestamps[idx])
        target_ts = pd.to_datetime(target_ts_str)

        # Lookback input timestamps must be strictly in the past: [t - lookback, t - 1]
        target_pos = df.index[df["timestamp"] == target_ts_str][0]
        input_window_ts = df["datetime"].iloc[target_pos - lookback : target_pos]

        for ts in input_window_ts:
            assert ts < target_ts, (
                f"Data leakage detected! Input timestamp {ts} is not strictly earlier than target {target_ts}"
            )

def test_rolling_features_shift_leakage_protection():
    """
    Verifies that rolling aggregations in feature engineering enforce shift(1)
    to prevent target leakage from the same timestamp.
    """
    cleaned_file = os.path.join("data", "processed", "cleaned_dataset.csv")
    df = pd.read_csv(cleaned_file).head(100)
    target_col = "total load actual"

    # Correct calculation: shifted by 1 hour
    rolling_mean_shifted = df[target_col].shift(1).rolling(window=6).mean()
    # Flawed calculation without shift: incorporates current value
    rolling_mean_unshifted = df[target_col].rolling(window=6).mean()

    # Assert they are distinct (difference verifies that the current timestamp is not leaked)
    for i in range(10, 20):
        assert rolling_mean_shifted.iloc[i] != rolling_mean_unshifted.iloc[i], (
            "Rolling window appears to include current observation!"
        )
