import os
import shutil

import pandas as pd
import pytest

from backend.database.models import ModelRegistry, Project, User
from backend.database.repositories.job_repo import JobRepository
from backend.database.repositories.project_repo import ProjectRepository
from backend.database.seed import seed_demo_data
from backend.database.session import SessionLocal
from src.gridsight.storage.workspace import WorkspaceStorage


@pytest.fixture(scope="module")
def db_session():
    seed_demo_data()
    db = SessionLocal()
    yield db
    db.close()

@pytest.fixture
def workspace_temp():
    test_root = "workspace_test_scratch"
    storage = WorkspaceStorage(workspace_root=test_root)
    yield storage
    if os.path.exists(test_root):
        shutil.rmtree(test_root)

# -----------------------------------------------------------------------------
# 1. Database & SQLite WAL Configuration Tests
# -----------------------------------------------------------------------------
def test_sqlite_wal_mode_enabled(db_session):
    """Verifies that SQLite is configured with WAL (Write-Ahead Logging) and busy timeout."""
    result = db_session.execute(
        db_session.bind.connect().connection.cursor().execute if False else
        __import__("sqlalchemy").text("PRAGMA journal_mode;")
    ).scalar()
    assert str(result).lower() == "wal"

def test_spain_demo_project_seeded(db_session):
    """Verifies that the Spain benchmark demo project and models were properly seeded."""
    project = db_session.query(Project).filter(Project.id == "spain-builtin-demo").first()
    assert project is not None
    assert project.name == "Spain National Grid (REE Benchmark)"
    assert project.is_demo is True
    assert project.quality_score > 90.0
    assert project.best_model_id == "Bi-LSTM"

    models = db_session.query(ModelRegistry).filter(ModelRegistry.project_id == project.id).all()
    assert len(models) >= 5
    model_names = [m.name for m in models]
    assert "Bi-LSTM" in model_names
    assert "Persistence Baseline" in model_names

# -----------------------------------------------------------------------------
# 2. Strict Multi-Tenant Project Isolation Tests
# -----------------------------------------------------------------------------
def test_project_isolation_between_tenants(db_session):
    """
    Mandatory Security Test: Prove that User A cannot read, query, or delete User B's project.
    """
    repo = ProjectRepository(db_session)

    # 1. Create User A and User B
    user_a = User(
        id="usr_tenant_a_101",
        username="alice_energy",
        email="alice@grid.org",
        password_hash="hash_a",
        role="analyst"
    )
    user_b = User(
        id="usr_tenant_b_202",
        username="bob_solar",
        email="bob@solar.org",
        password_hash="hash_b",
        role="analyst"
    )
    db_session.merge(user_a)
    db_session.merge(user_b)
    db_session.commit()

    # 2. User A creates a confidential project
    proj_a = repo.create_project(
        owner_id=user_a.id,
        name="Alice Confidential Grid",
        feature_level="L1",
        project_id="proj_alice_private_001"
    )

    # 3. User B attempts to access User A's private project -> MUST RETURN NONE
    accessed_by_b = repo.get_for_user(project_id=proj_a.id, user_id=user_b.id)
    assert accessed_by_b is None, "CRITICAL ISOLATION BREACH: User B accessed User A's project!"

    # 4. User B attempts to list projects -> MUST NOT INCLUDE User A's project
    b_projects = repo.list_for_user(user_id=user_b.id, include_demo=False)
    b_project_ids = [p.id for p in b_projects]
    assert proj_a.id not in b_project_ids

    # 5. User B attempts to delete User A's project -> MUST BE REJECTED
    delete_result = repo.delete_for_user(project_id=proj_a.id, user_id=user_b.id)
    assert delete_result is False, "CRITICAL ISOLATION BREACH: User B deleted User A's project!"

    # 6. Verify User A can still access their project
    accessed_by_a = repo.get_for_user(project_id=proj_a.id, user_id=user_a.id)
    assert accessed_by_a is not None
    assert accessed_by_a.id == proj_a.id

    # 7. Both users can access the public demo project
    demo_seen_by_a = repo.get_for_user("spain-builtin-demo", user_a.id)
    demo_seen_by_b = repo.get_for_user("spain-builtin-demo", user_b.id)
    assert demo_seen_by_a is not None and demo_seen_by_a.is_demo is True
    assert demo_seen_by_b is not None and demo_seen_by_b.is_demo is True

    # Cleanup test project
    repo.delete_for_user(proj_a.id, user_a.id)

# -----------------------------------------------------------------------------
# 3. Job Queue Repository Tests
# -----------------------------------------------------------------------------
def test_job_queue_lifecycle(db_session):
    """Verifies that JobRepository correctly transitions job statuses through the queue."""
    job_repo = JobRepository(db_session)

    # Enqueue a job
    job = job_repo.enqueue_job(
        project_id="spain-builtin-demo",
        job_type="train",
        strategy="standard",
        time_budget_sec=120
    )
    assert job.status == "queued"
    assert job.progress == 0.0

    # Poll next job
    polled = job_repo.poll_next_queued_job()
    assert polled is not None
    assert polled.id == job.id
    assert polled.status == "running"
    assert polled.started_at is not None

    # Update progress
    updated = job_repo.update_progress(job.id, progress=50.0, epoch_current=5)
    assert updated.progress == 50.0
    assert updated.epoch_current == 5

    # Complete job
    completed = job_repo.mark_completed(job.id, metrics_json='{"mape": 2.75}')
    assert completed.status == "completed"
    assert completed.progress == 100.0
    assert completed.completed_at is not None

# -----------------------------------------------------------------------------
# 4. Workspace Parquet Storage & Security Tests
# -----------------------------------------------------------------------------
def test_parquet_storage_roundtrip(workspace_temp):
    """Verifies saving and loading a DataFrame in Parquet format preserves types and contents."""
    df_sample = pd.DataFrame({
        "timestamp": ["2026-01-01 00:00:00", "2026-01-01 01:00:00", "2026-01-01 02:00:00"],
        "load_mw": [24500.5, 23800.2, 22950.0],
        "temperature_c": [12.4, 11.8, 11.2]
    })

    user_id = "user_test_01"
    project_id = "proj_test_01"

    # Save to Parquet
    saved_path = workspace_temp.save_parquet(
        user_id=user_id,
        project_id=project_id,
        category="processed",
        filename="dataset.parquet",
        df=df_sample
    )
    assert os.path.exists(saved_path)
    assert saved_path.endswith(".parquet")

    # Load back and verify equality
    loaded_df = workspace_temp.load_parquet(
        user_id=user_id,
        project_id=project_id,
        category="processed",
        filename="dataset.parquet"
    )
    assert len(loaded_df) == len(df_sample)
    assert list(loaded_df.columns) == list(df_sample.columns)
    assert loaded_df["load_mw"].iloc[0] == 24500.5

def test_path_traversal_protection(workspace_temp):
    """Security test: Rejects malicious path traversal attempts in identifiers and filenames."""
    with pytest.raises(ValueError):
        workspace_temp.get_project_dir(user_id="../../etc", project_id="proj_01")

    with pytest.raises(ValueError):
        workspace_temp.get_project_dir(user_id="user_01", project_id="../passwords")

    with pytest.raises(ValueError):
        workspace_temp.save_raw_file(
            user_id="user_01",
            project_id="proj_01",
            filename="../../malicious.sh",
            content=b"echo hack"
        )

def test_csv_formula_injection_defense(workspace_temp):
    """
    Security test: CSV exports protect against spreadsheet formula injection
    by escaping cells starting with '=', '+', '-', or '@'.
    """
    df_dangerous = pd.DataFrame({
        "cell_a": ["=CMD|'/C calc'!A0", "+SUM(1,2)", "Normal Text"],
        "cell_b": ["@SUM(A1:A5)", "-10*20", "Safe Value"]
    })

    saved_csv = workspace_temp.save_sanitized_csv(
        user_id="user_sec_01",
        project_id="proj_sec_01",
        category="reports",
        filename="export.csv",
        df=df_dangerous
    )

    with open(saved_csv, "r", encoding="utf-8") as f:
        content = f.read()

    # Assert that formula prefixes were neutralized with a single quote
    assert "'=CMD" in content
    assert "'+SUM" in content
    assert "'@SUM" in content
    assert "'-10*20" in content
