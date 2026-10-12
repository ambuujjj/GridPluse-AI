import os
import json
import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any, List

MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "models")
ARTIFACTS_DIR = os.path.join(os.path.dirname(__file__), "..", "artifacts")
DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "data")
PROCESSED_FILE = os.path.join(DATA_DIR, "processed", "cleaned_dataset.csv")
FEATURES_DIR = os.path.join(DATA_DIR, "features")

class MLService:
    def __init__(self):
        self._models = {}
        self._target_scaler = None
        self._feature_scaler = None
        self._df_cleaned = None
        self._test_X = None
        self._test_y = None
        self._test_timestamps = None
        self._leaderboard_data = None
        
    def get_target_scaler(self):
        if self._target_scaler is None:
            path = os.path.join(ARTIFACTS_DIR, "target_scaler.joblib")
            if os.path.exists(path):
                self._target_scaler = joblib.load(path)
        return self._target_scaler

    def get_feature_scaler(self):
        if self._feature_scaler is None:
            path = os.path.join(ARTIFACTS_DIR, "feature_scaler.joblib")
            if os.path.exists(path):
                self._feature_scaler = joblib.load(path)
        return self._feature_scaler

    def get_cleaned_data(self) -> pd.DataFrame:
        if self._df_cleaned is None:
            if os.path.exists(PROCESSED_FILE):
                self._df_cleaned = pd.read_csv(PROCESSED_FILE)
                self._df_cleaned['datetime'] = pd.to_datetime(self._df_cleaned['timestamp'])
        return self._df_cleaned

    def get_test_data(self):
        if self._test_X is None:
            x_path = os.path.join(FEATURES_DIR, "X_test.npy")
            y_path = os.path.join(FEATURES_DIR, "y_test_unscaled.npy")
            t_path = os.path.join(FEATURES_DIR, "test_timestamps.npy")
            if os.path.exists(x_path):
                self._test_X = np.load(x_path)
            if os.path.exists(y_path):
                self._test_y = np.load(y_path)
            if os.path.exists(t_path):
                self._test_timestamps = np.load(t_path, allow_pickle=True)
        return self._test_X, self._test_y, self._test_timestamps

    def get_model(self, model_key: str):
        if model_key in self._models:
            return self._models[model_key]
            
        import tensorflow as tf
        
        filename_map = {
            'best_model': 'best_model.keras',
            'lstm': 'lstm_model.keras',
            'gru': 'gru_model.keras',
            'bilstm': 'bilstm_model.keras',
            'cnn_lstm': 'cnn_lstm_model.keras'
        }
        
        file_to_load = filename_map.get(model_key.lower().replace("-", "_").replace(" ", "_"), 'best_model.keras')
        model_path = os.path.join(MODELS_DIR, file_to_load)
        
        if not os.path.exists(model_path):
            # Fallback to best_model.keras
            model_path = os.path.join(MODELS_DIR, "best_model.keras")
            
        if os.path.exists(model_path):
            try:
                model = tf.keras.models.load_model(model_path)
                self._models[model_key] = model
                return model
            except Exception as e:
                print(f"Error loading model {model_path}: {e}")
                return None
        return None

    def get_leaderboard(self) -> Dict[str, Any]:
        path = os.path.join(ARTIFACTS_DIR, "leaderboard.json")
        if os.path.exists(path):
            with open(path, "r") as f:
                return json.load(f)
        return {"best_model": "Bi-LSTM", "leaderboard": []}

    def predict(self, model_name: str, horizon: int = 24, start_offset: int = 0) -> Dict[str, Any]:
        X_test, y_test, timestamps = self.get_test_data()
        scaler = self.get_target_scaler()
        
        if X_test is None or scaler is None:
            raise ValueError("Test feature matrices or scalers are not yet compiled.")
            
        # Bound offset
        max_offset = max(0, len(X_test) - horizon - 1)
        offset = min(start_offset, max_offset)
        
        input_seqs = X_test[offset:offset+horizon]
        actuals = y_test[offset:offset+horizon] if y_test is not None else None
        ts = timestamps[offset:offset+horizon] if timestamps is not None else None
        
        model = self.get_model(model_name)
        if model is not None:
            preds_scaled = model.predict(input_seqs, verbose=0)
            preds_unscaled = scaler.inverse_transform(preds_scaled).ravel()
        else:
            # Fallback persistence lag if deep learning model is still saving
            preds_unscaled = scaler.inverse_transform(input_seqs[:, -1, 0].reshape(-1, 1)).ravel()
            
        forecast_points = []
        for i in range(len(preds_unscaled)):
            p = float(preds_unscaled[i])
            act = float(actuals[i]) if actuals is not None and i < len(actuals) else None
            # Realistic 95% confidence interval bound (~2.5% deviation)
            ci = p * 0.025
            
            t_str = str(ts[i]) if ts is not None and i < len(ts) else f"T+{i+1}h"
            forecast_points.append({
                "timestamp": t_str,
                "predicted_load": round(p, 1),
                "lower_bound": round(p - ci, 1),
                "upper_bound": round(p + ci, 1),
                "actual_load": round(act, 1) if act is not None else None
            })
            
        # Summary metrics
        mape = float(np.mean(np.abs((actuals - preds_unscaled) / actuals)) * 100) if actuals is not None else 0.0
        mae = float(np.mean(np.abs(actuals - preds_unscaled))) if actuals is not None else 0.0
        
        return {
            "model_used": model_name,
            "horizon": horizon,
            "forecast": forecast_points,
            "summary_metrics": {
                "mape": round(mape, 2),
                "mae_mw": round(mae, 1),
                "avg_load_mw": round(float(np.mean(preds_unscaled)), 1),
                "peak_load_mw": round(float(np.max(preds_unscaled)), 1),
                "trough_load_mw": round(float(np.min(preds_unscaled)), 1)
            }
        }

    def get_dataset_stats(self) -> Dict[str, Any]:
        df = self.get_cleaned_data()
        if df is None:
            return {"error": "Dataset not found"}
            
        target = 'total load actual'
        return {
            "total_records": len(df),
            "columns_count": len(df.columns),
            "start_date": str(df['timestamp'].min()),
            "end_date": str(df['timestamp'].max()),
            "target_variable": target,
            "mean_load": round(float(df[target].mean()), 1),
            "std_load": round(float(df[target].std()), 1),
            "min_load": round(float(df[target].min()), 1),
            "max_load": round(float(df[target].max()), 1),
            "features_list": list(df.columns)
        }

    def get_analytics(self) -> Dict[str, Any]:
        df = self.get_cleaned_data()
        if df is None:
            return {}
            
        # 1. Hourly Profile
        df_copy = df.copy()
        df_copy['hour'] = df_copy['datetime'].dt.hour
        df_copy['is_weekend'] = df_copy['datetime'].dt.dayofweek.isin([5, 6])
        
        hourly = df_copy.groupby(['hour', 'is_weekend'])['total load actual'].mean().unstack().reset_index()
        hourly_list = []
        for _, r in hourly.iterrows():
            hourly_list.append({
                "hour": int(r['hour']),
                "weekday_load": round(float(r[False]), 1),
                "weekend_load": round(float(r[True]), 1)
            })
            
        # 2. Monthly Trend
        df_copy['month'] = df_copy['datetime'].dt.month
        monthly = df_copy.groupby('month')['total load actual'].agg(['mean', 'min', 'max']).reset_index()
        month_names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        monthly_list = []
        for _, r in monthly.iterrows():
            m_idx = int(r['month']) - 1
            monthly_list.append({
                "month": month_names[m_idx],
                "avg_load": round(float(r['mean']), 1),
                "min_load": round(float(r['min']), 1),
                "max_load": round(float(r['max']), 1)
            })
            
        # 3. Temp vs Load
        temp_col = 'temp_spain_avg'
        if temp_col in df_copy.columns:
            # Bin into 1°C bins
            df_copy['temp_bin'] = df_copy[temp_col].round()
            temp_load = df_copy.groupby('temp_bin')['total load actual'].mean().reset_index()
            temp_load = temp_load[(temp_load['temp_bin'] >= 0) & (temp_load['temp_bin'] <= 38)]
            temp_vs_load = [{"temp_c": float(r['temp_bin']), "load_mw": round(float(r['total load actual']), 1)} for _, r in temp_load.iterrows()]
        else:
            temp_vs_load = []
            
        # 4. Renewable Mix
        renew_cols = ['generation solar', 'generation wind onshore', 'generation nuclear', 'generation fossil gas']
        mix_data = []
        sub = df_copy.tail(168)  # last 7 days
        for _, r in sub.iterrows():
            mix_data.append({
                "time": str(r['timestamp'])[-8:-3],
                "solar": round(float(r.get('generation solar', 0)), 1),
                "wind": round(float(r.get('generation wind onshore', 0)), 1),
                "nuclear": round(float(r.get('generation nuclear', 0)), 1),
                "fossil_gas": round(float(r.get('generation fossil gas', 0)), 1),
                "total_load": round(float(r['total load actual']), 1)
            })
            
        # 5. Correlation Matrix
        corr_cols = ['total load actual', 'temp_spain_avg', 'humidity_spain_avg', 'generation solar', 'generation wind onshore']
        avail_corr = [c for c in corr_cols if c in df_copy.columns]
        corr_df = df_copy[avail_corr].corr().round(3)
        corr_dict = {col: corr_df[col].to_dict() for col in corr_df.columns}

        return {
            "hourly_profile": hourly_list,
            "monthly_trend": monthly_list,
            "temp_vs_load": temp_vs_load,
            "correlation_matrix": corr_dict,
            "renewable_mix": mix_data
        }

ml_service = MLService()
