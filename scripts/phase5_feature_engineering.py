import os
import json
import joblib
import pandas as pd
import numpy as np
from sklearn.preprocessing import MinMaxScaler

def create_features():
    print("=== STARTING PHASE 5: FEATURE ENGINEERING ===")
    
    cleaned_file = os.path.join("data", "processed", "cleaned_dataset.csv")
    if not os.path.exists(cleaned_file):
        raise FileNotFoundError(f"Cleaned dataset not found at {cleaned_file}")
        
    output_dir = os.path.join("data", "features")
    artifacts_dir = os.path.join("backend", "artifacts")
    os.makedirs(output_dir, exist_ok=True)
    os.makedirs(artifacts_dir, exist_ok=True)
    
    print("Loading cleaned dataset...")
    df = pd.read_csv(cleaned_file)
    df['datetime'] = pd.to_datetime(df['timestamp'])
    df = df.sort_values('datetime').reset_index(drop=True)
    
    target_col = 'total load actual'
    
    # ----------------------------------------------------
    # 1. CALENDAR FEATURES
    # ----------------------------------------------------
    print("[1/4] Generating calendar features (hour, day, month, weekday, weekend, cyclical encodings)...")
    df['hour'] = df['datetime'].dt.hour
    df['day'] = df['datetime'].dt.day
    df['month'] = df['datetime'].dt.month
    df['weekday'] = df['datetime'].dt.dayofweek
    df['is_weekend'] = df['weekday'].isin([5, 6]).astype(int)
    
    # Cyclical sin/cos encodings for smooth periodic transitions
    df['hour_sin'] = np.sin(2 * np.pi * df['hour'] / 24.0)
    df['hour_cos'] = np.cos(2 * np.pi * df['hour'] / 24.0)
    df['month_sin'] = np.sin(2 * np.pi * df['month'] / 12.0)
    df['month_cos'] = np.cos(2 * np.pi * df['month'] / 12.0)
    
    # ----------------------------------------------------
    # 2. AUTOREGRESSIVE LAG FEATURES
    # ----------------------------------------------------
    print("[2/4] Generating autoregressive lag features (1h, 2h, 24h, 168h)...")
    df['load_lag_1'] = df[target_col].shift(1)
    df['load_lag_2'] = df[target_col].shift(2)
    df['load_lag_24'] = df[target_col].shift(24)    # 24h daily seasonal lag
    df['load_lag_168'] = df[target_col].shift(168)  # 168h weekly seasonal lag
    
    # ----------------------------------------------------
    # 3. ROLLING WINDOW STATISTICAL FEATURES
    # ----------------------------------------------------
    print("[3/4] Generating rolling window statistics (mean, std over 6h and 24h on past lag)...")
    # Using shift(1) to avoid lookahead data leakage
    df['load_roll_mean_6h'] = df[target_col].shift(1).rolling(window=6).mean()
    df['load_roll_std_6h'] = df[target_col].shift(1).rolling(window=6).std()
    df['load_roll_mean_24h'] = df[target_col].shift(1).rolling(window=24).mean()
    df['load_roll_std_24h'] = df[target_col].shift(1).rolling(window=24).std()
    
    # Select feature columns
    weather_features = [
        'temp_spain_avg', 'humidity_spain_avg', 'wind_speed_spain_avg', 'clouds_all_spain_avg',
        'temp_madrid', 'temp_barcelona', 'temp_valencia', 'temp_seville', 'temp_bilbao'
    ]
    
    calendar_features = ['hour_sin', 'hour_cos', 'month_sin', 'month_cos', 'weekday', 'is_weekend']
    lag_features = ['load_lag_1', 'load_lag_2', 'load_lag_24', 'load_lag_168']
    rolling_features = ['load_roll_mean_6h', 'load_roll_std_6h', 'load_roll_mean_24h', 'load_roll_std_24h']
    
    all_feature_cols = calendar_features + lag_features + rolling_features + weather_features
    print(f"Total engineered predictor features: {len(all_feature_cols)}")
    
    # Drop rows with NaNs resulting from 168h lag buffer
    initial_len = len(df)
    df_feat = df.dropna(subset=all_feature_cols + [target_col]).reset_index(drop=True)
    print(f"Dataset length after dropping lag-168 warm-up buffer: {len(df_feat)} rows (dropped {initial_len - len(df_feat)} rows)")

    # ----------------------------------------------------
    # 4. CHRONOLOGICAL SPLITTING (70% Train, 15% Val, 15% Test)
    # ----------------------------------------------------
    print("\n[4/4] Chronological train / validation / test split and scaling...")
    n = len(df_feat)
    train_end = int(n * 0.70)
    val_end = int(n * 0.85)
    
    train_df = df_feat.iloc[:train_end]
    val_df = df_feat.iloc[train_end:val_end]
    test_df = df_feat.iloc[val_end:]
    
    print(f"Train set: {len(train_df)} hours ({train_df['datetime'].min()} to {train_df['datetime'].max()})")
    print(f"Val set:   {len(val_df)} hours ({val_df['datetime'].min()} to {val_df['datetime'].max()})")
    print(f"Test set:  {len(test_df)} hours ({test_df['datetime'].min()} to {test_df['datetime'].max()})")
    
    # Feature Scaling (Fit on Train only!)
    feature_scaler = MinMaxScaler(feature_range=(0, 1))
    X_train_scaled = feature_scaler.fit_transform(train_df[all_feature_cols])
    X_val_scaled = feature_scaler.transform(val_df[all_feature_cols])
    X_test_scaled = feature_scaler.transform(test_df[all_feature_cols])
    
    # Target Scaling (Fit on Train only)
    target_scaler = MinMaxScaler(feature_range=(0, 1))
    y_train_scaled = target_scaler.fit_transform(train_df[[target_col]]).ravel()
    y_val_scaled = target_scaler.transform(val_df[[target_col]]).ravel()
    y_test_scaled = target_scaler.transform(test_df[[target_col]]).ravel()
    
    y_train_raw = train_df[target_col].values
    y_val_raw = val_df[target_col].values
    y_test_raw = test_df[target_col].values
    
    # Save scalers to disk
    joblib.dump(feature_scaler, os.path.join(artifacts_dir, "feature_scaler.joblib"))
    joblib.dump(target_scaler, os.path.join(artifacts_dir, "target_scaler.joblib"))
    joblib.dump(feature_scaler, os.path.join(output_dir, "feature_scaler.joblib"))
    joblib.dump(target_scaler, os.path.join(output_dir, "target_scaler.joblib"))
    print("Saved feature and target scalers to backend/artifacts/ and data/features/.")
    
    # ----------------------------------------------------
    # 5. CREATE 3D SEQUENCE TENSORS FOR DEEP LEARNING (Lookback = 24)
    # ----------------------------------------------------
    lookback = 24  # Past 24 hours to forecast next hour
    
    def create_sequences(X, y, lookback_window):
        X_seq, y_seq = [], []
        for i in range(lookback_window, len(X)):
            X_seq.append(X[i-lookback_window:i])
            y_seq.append(y[i])
        return np.array(X_seq, dtype=np.float32), np.array(y_seq, dtype=np.float32)
        
    print(f"Generating sequence windows (Lookback = {lookback} hours)...")
    X_train_seq, y_train_seq = create_sequences(X_train_scaled, y_train_scaled, lookback)
    X_val_seq, y_val_seq = create_sequences(X_val_scaled, y_val_scaled, lookback)
    X_test_seq, y_test_seq = create_sequences(X_test_scaled, y_test_scaled, lookback)
    
    print(f"X_train shape: {X_train_seq.shape}, y_train shape: {y_train_seq.shape}")
    print(f"X_val shape:   {X_val_seq.shape}, y_val shape:   {y_val_seq.shape}")
    print(f"X_test shape:  {X_test_seq.shape}, y_test shape:  {y_test_seq.shape}")
    
    # Save sequence tensors
    np.save(os.path.join(output_dir, "X_train.npy"), X_train_seq)
    np.save(os.path.join(output_dir, "y_train.npy"), y_train_seq)
    np.save(os.path.join(output_dir, "X_val.npy"), X_val_seq)
    np.save(os.path.join(output_dir, "y_val.npy"), y_val_seq)
    np.save(os.path.join(output_dir, "X_test.npy"), X_test_seq)
    np.save(os.path.join(output_dir, "y_test.npy"), y_test_seq)
    
    # Also save raw test targets and timestamps for evaluation
    test_timestamps = test_df['timestamp'].values[lookback:]
    y_test_unscaled = y_test_raw[lookback:]
    np.save(os.path.join(output_dir, "y_test_unscaled.npy"), y_test_unscaled)
    np.save(os.path.join(output_dir, "test_timestamps.npy"), test_timestamps)
    
    # Save feature metadata
    metadata = {
        'total_features': len(all_feature_cols),
        'feature_names': all_feature_cols,
        'calendar_features': calendar_features,
        'lag_features': lag_features,
        'rolling_features': rolling_features,
        'weather_features': weather_features,
        'lookback': lookback,
        'splits': {
            'train': {
                'samples': len(X_train_seq),
                'start': str(train_df['datetime'].iloc[lookback]),
                'end': str(train_df['datetime'].iloc[-1])
            },
            'val': {
                'samples': len(X_val_seq),
                'start': str(val_df['datetime'].iloc[lookback]),
                'end': str(val_df['datetime'].iloc[-1])
            },
            'test': {
                'samples': len(X_test_seq),
                'start': str(test_df['datetime'].iloc[lookback]),
                'end': str(test_df['datetime'].iloc[-1])
            }
        }
    }
    
    with open(os.path.join(output_dir, "feature_metadata.json"), "w") as f:
        json.dump(metadata, f, indent=2)
    with open(os.path.join(artifacts_dir, "feature_metadata.json"), "w") as f:
        json.dump(metadata, f, indent=2)
        
    print("Saved feature tensors and metadata successfully!")
    print("=== PHASE 5 FEATURE ENGINEERING COMPLETED SUCCESSFULLY! ===")

if __name__ == '__main__':
    create_features()
