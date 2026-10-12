import hashlib
import json
import os
import sys
from typing import Optional

from sqlalchemy.orm import Session

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from backend.database.models import (
    ColumnMapping,
    ModelRegistry,
    Project,
    QualityReport,
    User,
)
from backend.database.session import SessionLocal


def seed_demo_data(db: Optional[Session] = None):
    close_after = False
    if db is None:
        db = SessionLocal()
        close_after = True

    try:
        # 1. Seed Demo User
        demo_user = db.query(User).filter(User.username == "demo_user").first()
        if not demo_user:
            # Deterministic password hash for demo environment
            demo_pass_hash = hashlib.sha256("gridsight2026".encode()).hexdigest()
            demo_user = User(
                id="user_demo_001",
                username="demo_user",
                email="demo@gridsight.energy",
                password_hash=demo_pass_hash,
                role="admin",
                is_active=True,
            )
            db.add(demo_user)
            db.commit()
            db.refresh(demo_user)
            print("Seeded demo user: demo_user (ID: user_demo_001)")

        # 2. Seed Spain Built-in Demo Project
        spain_demo = db.query(Project).filter(Project.id == "spain-builtin-demo").first()
        if not spain_demo:
            spain_demo = Project(
                id="spain-builtin-demo",
                owner_id=demo_user.id,
                name="Spain National Grid (REE Benchmark)",
                description=(
                    "Built-in benchmark project analyzing 4 years (35,064 hours) of Spain's transmission "
                    "grid telemetry (REE) synchronized with 5-city meteorological observations."
                ),
                feature_level="L2",
                frequency=60,
                unit="MW",
                timezone="UTC",
                country_holidays="ES",
                status="ready",
                quality_score=98.5,
                quality_grade="A",
                best_model_id="Bi-LSTM",
                is_demo=True,
            )
            db.add(spain_demo)
            db.commit()
            db.refresh(spain_demo)
            print("Seeded Spain demo project: spain-builtin-demo")

        # 3. Seed Models in ModelRegistry from leaderboard.json
        artifacts_dir = os.path.join(os.path.dirname(__file__), "..", "artifacts")
        leaderboard_path = os.path.join(artifacts_dir, "leaderboard.json")
        models_dir = os.path.join(os.path.dirname(__file__), "..", "models")

        if os.path.exists(leaderboard_path):
            with open(leaderboard_path) as f:
                lb_data = json.load(f)

            for item in lb_data.get("leaderboard", []):
                m_name = item["model_name"]
                existing_m = db.query(ModelRegistry).filter(
                    ModelRegistry.project_id == spain_demo.id,
                    ModelRegistry.name == m_name
                ).first()

                if not existing_m:
                    m_file = item.get("model_file", "model.keras")
                    m_path = os.path.join(models_dir, m_file) if not m_file.startswith("base") else m_file
                    m_reg = ModelRegistry(
                        id=f"mod_spain_{m_name.lower().replace(' ', '_').replace('-', '_')}",
                        project_id=spain_demo.id,
                        name=m_name,
                        architecture=m_name,
                        version=1,
                        feature_level="L2",
                        mae=item.get("mae"),
                        rmse=item.get("rmse"),
                        mape=item.get("mape"),
                        r2=item.get("r2"),
                        model_path=m_path,
                        is_best=item.get("is_best", False),
                        is_benchmark=(item.get("model_file") == "benchmark"),
                    )
                    db.add(m_reg)
            db.commit()
            print("Seeded Spain models in ModelRegistry.")

        # 4. Seed Quality Report for Spain
        existing_qr = db.query(QualityReport).filter(QualityReport.project_id == spain_demo.id).first()
        if not existing_qr:
            qr = QualityReport(
                id="qr_spain_demo_001",
                project_id=spain_demo.id,
                score=98.5,
                grade="A",
                components_json=json.dumps({
                    "completeness": 24.8,
                    "time_regularity": 15.0,
                    "duplicates": 10.0,
                    "outliers_spikes": 14.5,
                    "flat_lines": 10.0,
                    "history_length": 15.0,
                    "covariate_availability": 9.2
                }),
                findings_json=json.dumps([
                    "Strict hourly temporal continuity across 35,064 consecutive hours verified.",
                    "36 missing target records interpolated linearly (longest continuous missing sequence: 8h).",
                    "Pivoted 5 meteorological stations (Madrid, Barcelona, Valencia, Seville, Bilbao).",
                    "Filtered atmospheric pressure sensor glitches (<900 and >1080 hPa) and wind speeds >35 m/s."
                ]),
                fixes_applied_json=json.dumps([
                    "Converted Kelvin temperatures to Celsius.",
                    "Dropped 100% empty columns (pumped hydro storage aggregated, wind offshore forecast).",
                    "Synthesized national macro weather indicators from regional averages."
                ]),
            )
            db.add(qr)
            db.commit()
            print("Seeded Spain quality report.")

        # 5. Seed Canonical Column Mapping
        existing_cm = db.query(ColumnMapping).filter(ColumnMapping.project_id == spain_demo.id).first()
        if not existing_cm:
            cm = ColumnMapping(
                id="cm_spain_demo_001",
                project_id=spain_demo.id,
                mapping_json=json.dumps({
                    "timestamp": "timestamp",
                    "load": "total load actual",
                    "operator_forecast": "total load forecast",
                    "temperature": "temp_spain_avg",
                    "humidity": "humidity_spain_avg",
                    "wind_speed": "wind_speed_spain_avg",
                    "cloud_cover": "clouds_all_spain_avg",
                    "solar": "generation solar",
                    "wind": "generation wind onshore",
                    "price": "price actual"
                }),
                is_template=True,
            )
            db.add(cm)
            db.commit()
            print("Seeded Spain canonical column mapping.")

    finally:
        if close_after:
            db.close()

if __name__ == "__main__":
    seed_demo_data()
