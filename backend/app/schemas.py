from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class PredictionRequest(BaseModel):
    model_name: Optional[str] = Field(default="Best Model", description="Model architecture to use")
    horizon: int = Field(default=24, ge=1, le=168, description="Forecast horizon in hours (1-168)")
    start_offset: Optional[int] = Field(default=0, ge=0, description="Offset index into test set for demonstration")

class ForecastPoint(BaseModel):
    timestamp: str
    predicted_load: float
    lower_bound: float
    upper_bound: float
    actual_load: Optional[float] = None

class PredictionResponse(BaseModel):
    model_used: str
    horizon: int
    forecast: List[ForecastPoint]
    summary_metrics: Dict[str, Any]

class TrainRequest(BaseModel):
    model_type: str = Field(default="LSTM", description="Architecture: LSTM, GRU, Bi-LSTM, or CNN-LSTM")
    epochs: int = Field(default=5, ge=1, le=50)
    batch_size: int = Field(default=128, ge=16, le=512)
    learning_rate: float = Field(default=0.001, ge=0.00001, le=0.1)

class TrainResponse(BaseModel):
    status: str
    model_type: str
    epochs_trained: int
    train_time_sec: float
    metrics: Dict[str, float]
    message: str

class ModelLeaderboardItem(BaseModel):
    model_name: str
    mae: float
    rmse: float
    mape: float
    r2: float
    train_time_sec: float
    model_file: str
    is_best: bool = False

class LeaderboardResponse(BaseModel):
    best_model: str
    leaderboard: List[ModelLeaderboardItem]

class SystemHealthResponse(BaseModel):
    status: str
    api_version: str
    framework: str
    tensorflow_version: str
    device: str
    total_models_available: int
    best_model_loaded: bool

class DatasetStatsResponse(BaseModel):
    total_records: int
    columns_count: int
    start_date: str
    end_date: str
    target_variable: str
    mean_load: float
    std_load: float
    min_load: float
    max_load: float
    features_list: List[str]

class AnalyticsResponse(BaseModel):
    hourly_profile: List[Dict[str, Any]]
    monthly_trend: List[Dict[str, Any]]
    temp_vs_load: List[Dict[str, Any]]
    correlation_matrix: Dict[str, Any]
    renewable_mix: List[Dict[str, Any]]
