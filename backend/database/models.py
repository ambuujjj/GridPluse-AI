import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from backend.database.session import Base


def utcnow():
    return datetime.datetime.now(datetime.timezone.utc)

# -----------------------------------------------------------------------------
# 1. User & Authentication
# -----------------------------------------------------------------------------
class User(Base):
    __tablename__ = "users"

    id = Column(String(64), primary_key=True, index=True)  # e.g. usr_123 or UUID
    username = Column(String(64), unique=True, index=True, nullable=False)
    email = Column(String(128), unique=True, index=True, nullable=False)
    password_hash = Column(String(256), nullable=False)
    role = Column(String(32), default="analyst", nullable=False)  # admin, analyst, viewer
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    # Relationships
    projects = relationship("Project", back_populates="owner", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="user")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")

# -----------------------------------------------------------------------------
# 2. Projects & Ingestion
# -----------------------------------------------------------------------------
class Project(Base):
    __tablename__ = "projects"

    id = Column(String(64), primary_key=True, index=True)  # e.g. "spain-builtin-demo" or UUID
    owner_id = Column(String(64), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(128), nullable=False)
    description = Column(Text, nullable=True)
    feature_level = Column(String(16), default="L0", nullable=False)  # L0, L1, L2
    frequency = Column(Integer, default=60, nullable=False)  # 5, 15, 30, 60 minutes
    unit = Column(String(16), default="MW", nullable=False)  # kW, MW, GW
    timezone = Column(String(64), default="UTC", nullable=False)
    country_holidays = Column(String(32), default="ES", nullable=True)
    status = Column(String(32), default="draft", nullable=False)  # draft, ready, training, active
    quality_score = Column(Float, nullable=True)  # 0.0 - 100.0
    quality_grade = Column(String(4), nullable=True)  # A, B, C, D
    best_model_id = Column(String(64), nullable=True)
    is_demo = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

    # Relationships
    owner = relationship("User", back_populates="projects")
    files = relationship("ProjectFile", back_populates="project", cascade="all, delete-orphan")
    column_mapping = relationship("ColumnMapping", back_populates="project", uselist=False, cascade="all, delete-orphan")
    quality_reports = relationship("QualityReport", back_populates="project", cascade="all, delete-orphan")
    training_jobs = relationship("TrainingJob", back_populates="project", cascade="all, delete-orphan")
    models = relationship("ModelRegistry", back_populates="project", cascade="all, delete-orphan")
    forecast_runs = relationship("ForecastRun", back_populates="project", cascade="all, delete-orphan")
    predictions = relationship("PredictionRecord", back_populates="project", cascade="all, delete-orphan")
    anomalies = relationship("AnomalyRecord", back_populates="project", cascade="all, delete-orphan")
    drift_metrics = relationship("DriftMetric", back_populates="project", cascade="all, delete-orphan")
    api_keys = relationship("ApiKey", back_populates="project", cascade="all, delete-orphan")

class ProjectFile(Base):
    __tablename__ = "project_files"

    id = Column(String(64), primary_key=True, index=True)
    project_id = Column(String(64), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    original_name = Column(String(256), nullable=False)
    stored_path = Column(String(512), nullable=False)  # workspace/<user_id>/<project_id>/raw/...
    file_format = Column(String(16), default="csv", nullable=False)  # csv, xlsx, parquet
    rows = Column(Integer, nullable=True)
    start_ts = Column(DateTime(timezone=True), nullable=True)
    end_ts = Column(DateTime(timezone=True), nullable=True)
    checksum = Column(String(64), nullable=True)  # SHA-256
    uploaded_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    project = relationship("Project", back_populates="files")

class ColumnMapping(Base):
    __tablename__ = "column_mappings"

    id = Column(String(64), primary_key=True, index=True)
    project_id = Column(String(64), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    mapping_json = Column(Text, nullable=False)  # JSON dictionary of canonical -> source column
    is_template = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    project = relationship("Project", back_populates="column_mapping")

class QualityReport(Base):
    __tablename__ = "quality_reports"

    id = Column(String(64), primary_key=True, index=True)
    project_id = Column(String(64), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    score = Column(Float, nullable=False)  # 0 to 100
    grade = Column(String(4), nullable=False)  # A, B, C, D
    components_json = Column(Text, nullable=False)  # Breakdown scores
    findings_json = Column(Text, nullable=False)  # List of findings and plain language descriptions
    fixes_applied_json = Column(Text, nullable=True)  # Actions accepted / applied
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    project = relationship("Project", back_populates="quality_reports")

# -----------------------------------------------------------------------------
# 3. Model Registry & Training Jobs Queue
# -----------------------------------------------------------------------------
class ModelRegistry(Base):
    __tablename__ = "model_registry"

    id = Column(String(64), primary_key=True, index=True)  # model UUID or key
    project_id = Column(String(64), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(128), nullable=False)
    architecture = Column(String(64), nullable=False)  # Bi-LSTM, LSTM, GRU, CNN-LSTM, GridSight-Net
    version = Column(Integer, default=1, nullable=False)
    feature_level = Column(String(16), default="L0", nullable=False)
    mae = Column(Float, nullable=True)
    rmse = Column(Float, nullable=True)
    mape = Column(Float, nullable=True)
    r2 = Column(Float, nullable=True)
    model_path = Column(String(512), nullable=False)
    is_best = Column(Boolean, default=False, nullable=False)
    is_benchmark = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    project = relationship("Project", back_populates="models")
    forecast_runs = relationship("ForecastRun", back_populates="model")

class TrainingJob(Base):
    __tablename__ = "training_jobs"

    id = Column(String(64), primary_key=True, index=True)  # job_UUID
    project_id = Column(String(64), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    job_type = Column(String(32), default="train", nullable=False)  # train, finetune, tune, evaluate
    strategy = Column(String(32), default="standard", nullable=False)  # quick, standard, finetune
    status = Column(String(32), default="queued", nullable=False, index=True)  # queued, running, completed, failed, cancelled
    progress = Column(Float, default=0.0, nullable=False)  # 0 to 100%
    epoch_current = Column(Integer, default=0)
    epochs_total = Column(Integer, default=10)
    metrics_json = Column(Text, nullable=True)
    error_message = Column(Text, nullable=True)
    time_budget_sec = Column(Integer, default=300)
    horizon_hours = Column(Integer, default=24)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    project = relationship("Project", back_populates="training_jobs")

# -----------------------------------------------------------------------------
# 4. Forecasts, Actuals Tracking, & Predictions
# -----------------------------------------------------------------------------
class ForecastRun(Base):
    __tablename__ = "forecast_runs"

    id = Column(String(64), primary_key=True, index=True)
    project_id = Column(String(64), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    model_id = Column(String(64), ForeignKey("model_registry.id", ondelete="SET NULL"), nullable=True, index=True)
    origin_ts = Column(DateTime(timezone=True), nullable=False)
    horizon_h = Column(Integer, default=24, nullable=False)
    status = Column(String(32), default="completed", nullable=False)
    summary_metrics_json = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    project = relationship("Project", back_populates="forecast_runs")
    model = relationship("ModelRegistry", back_populates="forecast_runs")
    predictions = relationship("PredictionRecord", back_populates="forecast_run", cascade="all, delete-orphan")
    score = relationship("ForecastScore", back_populates="forecast_run", uselist=False, cascade="all, delete-orphan")

class PredictionRecord(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    project_id = Column(String(64), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    run_id = Column(String(64), ForeignKey("forecast_runs.id", ondelete="CASCADE"), nullable=True, index=True)
    timestamp = Column(String(64), nullable=False, index=True)
    predicted_load = Column(Float, nullable=False)
    lower_bound = Column(Float, nullable=False)
    upper_bound = Column(Float, nullable=False)
    actual_load = Column(Float, nullable=True)

    project = relationship("Project", back_populates="predictions")
    forecast_run = relationship("ForecastRun", back_populates="predictions")

class ActualsUpload(Base):
    __tablename__ = "actuals_uploads"

    id = Column(String(64), primary_key=True, index=True)
    project_id = Column(String(64), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    file_path = Column(String(512), nullable=False)
    rows = Column(Integer, nullable=False)
    start_ts = Column(DateTime(timezone=True), nullable=True)
    end_ts = Column(DateTime(timezone=True), nullable=True)
    uploaded_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

class ForecastScore(Base):
    __tablename__ = "forecast_scores"

    id = Column(String(64), primary_key=True, index=True)
    run_id = Column(String(64), ForeignKey("forecast_runs.id", ondelete="CASCADE"), nullable=False, index=True)
    project_id = Column(String(64), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    mae = Column(Float, nullable=False)
    mape = Column(Float, nullable=False)
    rmse = Column(Float, nullable=False)
    scored_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    forecast_run = relationship("ForecastRun", back_populates="score")

# -----------------------------------------------------------------------------
# 5. Monitoring, Anomalies, Drift, Security, Audit
# -----------------------------------------------------------------------------
class AnomalyRecord(Base):
    __tablename__ = "anomalies"

    id = Column(String(64), primary_key=True, index=True)
    project_id = Column(String(64), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    timestamp = Column(String(64), nullable=False, index=True)
    type = Column(String(32), nullable=False)  # spike, drop, flatline, missing_block
    severity = Column(String(16), default="medium", nullable=False)  # low, medium, high, critical
    residual = Column(Float, nullable=True)
    status = Column(String(32), default="open", nullable=False)  # open, confirmed, ignored
    exclude_from_training = Column(Boolean, default=False, nullable=False)
    detected_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    project = relationship("Project", back_populates="anomalies")

class DriftMetric(Base):
    __tablename__ = "drift_metrics"

    id = Column(String(64), primary_key=True, index=True)
    project_id = Column(String(64), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    computed_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    feature = Column(String(128), nullable=False)
    psi = Column(Float, nullable=True)  # Population Stability Index
    ks_pvalue = Column(Float, nullable=True)  # Kolmogorov-Smirnov p-value
    rolling_mape = Column(Float, nullable=True)
    retrain_recommended = Column(Boolean, default=False, nullable=False)

    project = relationship("Project", back_populates="drift_metrics")

class ApiKey(Base):
    __tablename__ = "api_keys"

    id = Column(String(64), primary_key=True, index=True)
    project_id = Column(String(64), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    key_hash = Column(String(128), nullable=False, index=True)
    key_prefix = Column(String(16), nullable=False)  # e.g. "gs_live_..."
    label = Column(String(64), default="Default Key", nullable=False)
    last_used_at = Column(DateTime(timezone=True), nullable=True)
    revoked_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    project = relationship("Project", back_populates="api_keys")

class AuditLog(Base):
    __tablename__ = "audit_log"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(64), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    action = Column(String(64), nullable=False)  # upload, train, delete, predict, api_key_created
    entity = Column(String(64), nullable=False)  # project, model, file, user
    entity_id = Column(String(64), nullable=True)
    details_json = Column(Text, nullable=True)
    ip_address = Column(String(45), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    user = relationship("User", back_populates="audit_logs")

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(64), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    message = Column(Text, nullable=False)
    level = Column(String(16), default="info", nullable=False)  # info, warning, error, success
    read = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    user = relationship("User", back_populates="notifications")

# Optimization indexes
Index("idx_predictions_project_time", PredictionRecord.project_id, PredictionRecord.timestamp)
Index("idx_anomalies_project_status", AnomalyRecord.project_id, AnomalyRecord.status)
Index("idx_jobs_project_status", TrainingJob.project_id, TrainingJob.status)
