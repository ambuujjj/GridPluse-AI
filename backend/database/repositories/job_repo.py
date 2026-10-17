import datetime
import uuid
from typing import List, Optional

from sqlalchemy.orm import Session

from backend.database.models import TrainingJob
from backend.database.repositories.base import BaseRepository


class JobRepository(BaseRepository[TrainingJob]):
    """
    DB-backed job queue repository.
    Enables asynchronous worker polling and task lifecycle tracking without requiring Redis.
    """

    def __init__(self, db: Session):
        super().__init__(TrainingJob, db)

    def enqueue_job(
        self,
        project_id: str,
        job_type: str = "train",
        strategy: str = "standard",
        time_budget_sec: int = 300,
        horizon_hours: int = 24,
        epochs_total: int = 10,
    ) -> TrainingJob:
        job = TrainingJob(
            id=f"job_{uuid.uuid4().hex[:12]}",
            project_id=project_id,
            job_type=job_type,
            strategy=strategy,
            status="queued",
            progress=0.0,
            epoch_current=0,
            epochs_total=epochs_total,
            time_budget_sec=time_budget_sec,
            horizon_hours=horizon_hours,
        )
        return self.create(job)

    def poll_next_queued_job(self) -> Optional[TrainingJob]:
        """
        Polls the oldest queued job and atomically transitions status to 'running'.
        """
        job = (
            self.db.query(TrainingJob)
            .filter(TrainingJob.status == "queued")
            .order_by(TrainingJob.created_at.asc())
            .with_for_update() if "sqlite" not in str(self.db.bind.url) else
            self.db.query(TrainingJob)
            .filter(TrainingJob.status == "queued")
            .order_by(TrainingJob.created_at.asc())
        ).first()

        if job:
            job.status = "running"
            job.started_at = datetime.datetime.now(datetime.timezone.utc)
            self.db.commit()
            self.db.refresh(job)
        return job

    def update_progress(
        self,
        job_id: str,
        progress: float,
        epoch_current: Optional[int] = None,
        metrics_json: Optional[str] = None,
    ) -> Optional[TrainingJob]:
        job = self.get_by_id(job_id)
        if job and job.status == "running":
            job.progress = min(100.0, max(0.0, progress))
            if epoch_current is not None:
                job.epoch_current = epoch_current
            if metrics_json is not None:
                job.metrics_json = metrics_json
            self.db.commit()
            self.db.refresh(job)
        return job

    def mark_completed(self, job_id: str, metrics_json: Optional[str] = None) -> Optional[TrainingJob]:
        job = self.get_by_id(job_id)
        if job:
            job.status = "completed"
            job.progress = 100.0
            job.completed_at = datetime.datetime.now(datetime.timezone.utc)
            if metrics_json:
                job.metrics_json = metrics_json
            self.db.commit()
            self.db.refresh(job)
        return job

    def mark_failed(self, job_id: str, error_message: str) -> Optional[TrainingJob]:
        job = self.get_by_id(job_id)
        if job:
            job.status = "failed"
            job.error_message = error_message
            job.completed_at = datetime.datetime.now(datetime.timezone.utc)
            self.db.commit()
            self.db.refresh(job)
        return job

    def cancel_job(self, job_id: str) -> bool:
        job = self.get_by_id(job_id)
        if job and job.status in ["queued", "running"]:
            job.status = "cancelled"
            job.completed_at = datetime.datetime.now(datetime.timezone.utc)
            self.db.commit()
            return True
        return False

    def list_for_project(self, project_id: str, limit: int = 20) -> List[TrainingJob]:
        return (
            self.db.query(TrainingJob)
            .filter(TrainingJob.project_id == project_id)
            .order_by(TrainingJob.created_at.desc())
            .limit(limit)
            .all()
        )
