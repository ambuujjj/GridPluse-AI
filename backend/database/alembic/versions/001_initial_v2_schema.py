"""Initial v2 schema for GridSight platform

Revision ID: 001_initial_v2_schema
Revises: None
Create Date: 2026-10-12 21:25:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = '001_initial_v2_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # 1. users
    op.create_table(
        'users',
        sa.Column('id', sa.String(length=64), primary_key=True),
        sa.Column('username', sa.String(length=64), nullable=False, unique=True),
        sa.Column('email', sa.String(length=128), nullable=False, unique=True),
        sa.Column('password_hash', sa.String(length=256), nullable=False),
        sa.Column('role', sa.String(length=32), nullable=False, server_default='analyst'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_users_username', 'users', ['username'])
    op.create_index('ix_users_email', 'users', ['email'])

    # 2. projects
    op.create_table(
        'projects',
        sa.Column('id', sa.String(length=64), primary_key=True),
        sa.Column('owner_id', sa.String(length=64), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('name', sa.String(length=128), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('feature_level', sa.String(length=16), nullable=False, server_default='L0'),
        sa.Column('frequency', sa.Integer(), nullable=False, server_default='60'),
        sa.Column('unit', sa.String(length=16), nullable=False, server_default='MW'),
        sa.Column('timezone', sa.String(length=64), nullable=False, server_default='UTC'),
        sa.Column('country_holidays', sa.String(length=32), nullable=True, server_default='ES'),
        sa.Column('status', sa.String(length=32), nullable=False, server_default='draft'),
        sa.Column('quality_score', sa.Float(), nullable=True),
        sa.Column('quality_grade', sa.String(length=4), nullable=True),
        sa.Column('best_model_id', sa.String(length=64), nullable=True),
        sa.Column('is_demo', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_projects_owner_id', 'projects', ['owner_id'])

    # 3. project_files
    op.create_table(
        'project_files',
        sa.Column('id', sa.String(length=64), primary_key=True),
        sa.Column('project_id', sa.String(length=64), sa.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False),
        sa.Column('original_name', sa.String(length=256), nullable=False),
        sa.Column('stored_path', sa.String(length=512), nullable=False),
        sa.Column('file_format', sa.String(length=16), nullable=False, server_default='csv'),
        sa.Column('rows', sa.Integer(), nullable=True),
        sa.Column('start_ts', sa.DateTime(timezone=True), nullable=True),
        sa.Column('end_ts', sa.DateTime(timezone=True), nullable=True),
        sa.Column('checksum', sa.String(length=64), nullable=True),
        sa.Column('uploaded_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_project_files_project_id', 'project_files', ['project_id'])

    # 4. column_mappings
    op.create_table(
        'column_mappings',
        sa.Column('id', sa.String(length=64), primary_key=True),
        sa.Column('project_id', sa.String(length=64), sa.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False),
        sa.Column('mapping_json', sa.Text(), nullable=False),
        sa.Column('is_template', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_column_mappings_project_id', 'column_mappings', ['project_id'])

    # 5. quality_reports
    op.create_table(
        'quality_reports',
        sa.Column('id', sa.String(length=64), primary_key=True),
        sa.Column('project_id', sa.String(length=64), sa.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False),
        sa.Column('score', sa.Float(), nullable=False),
        sa.Column('grade', sa.String(length=4), nullable=False),
        sa.Column('components_json', sa.Text(), nullable=False),
        sa.Column('findings_json', sa.Text(), nullable=False),
        sa.Column('fixes_applied_json', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_quality_reports_project_id', 'quality_reports', ['project_id'])

    # 6. model_registry
    op.create_table(
        'model_registry',
        sa.Column('id', sa.String(length=64), primary_key=True),
        sa.Column('project_id', sa.String(length=64), sa.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False),
        sa.Column('name', sa.String(length=128), nullable=False),
        sa.Column('architecture', sa.String(length=64), nullable=False),
        sa.Column('version', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('feature_level', sa.String(length=16), nullable=False, server_default='L0'),
        sa.Column('mae', sa.Float(), nullable=True),
        sa.Column('rmse', sa.Float(), nullable=True),
        sa.Column('mape', sa.Float(), nullable=True),
        sa.Column('r2', sa.Float(), nullable=True),
        sa.Column('model_path', sa.String(length=512), nullable=False),
        sa.Column('is_best', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('is_benchmark', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_model_registry_project_id', 'model_registry', ['project_id'])

    # 7. training_jobs
    op.create_table(
        'training_jobs',
        sa.Column('id', sa.String(length=64), primary_key=True),
        sa.Column('project_id', sa.String(length=64), sa.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False),
        sa.Column('job_type', sa.String(length=32), nullable=False, server_default='train'),
        sa.Column('strategy', sa.String(length=32), nullable=False, server_default='standard'),
        sa.Column('status', sa.String(length=32), nullable=False, server_default='queued'),
        sa.Column('progress', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('epoch_current', sa.Integer(), nullable=True, server_default='0'),
        sa.Column('epochs_total', sa.Integer(), nullable=True, server_default='10'),
        sa.Column('metrics_json', sa.Text(), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('time_budget_sec', sa.Integer(), nullable=True, server_default='300'),
        sa.Column('horizon_hours', sa.Integer(), nullable=True, server_default='24'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index('ix_training_jobs_project_id', 'training_jobs', ['project_id'])
    op.create_index('ix_training_jobs_status', 'training_jobs', ['status'])

    # 8. forecast_runs
    op.create_table(
        'forecast_runs',
        sa.Column('id', sa.String(length=64), primary_key=True),
        sa.Column('project_id', sa.String(length=64), sa.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False),
        sa.Column('model_id', sa.String(length=64), sa.ForeignKey('model_registry.id', ondelete='SET NULL'), nullable=True),
        sa.Column('origin_ts', sa.DateTime(timezone=True), nullable=False),
        sa.Column('horizon_h', sa.Integer(), nullable=False, server_default='24'),
        sa.Column('status', sa.String(length=32), nullable=False, server_default='completed'),
        sa.Column('summary_metrics_json', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_forecast_runs_project_id', 'forecast_runs', ['project_id'])

    # 9. predictions
    op.create_table(
        'predictions',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('project_id', sa.String(length=64), sa.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False),
        sa.Column('run_id', sa.String(length=64), sa.ForeignKey('forecast_runs.id', ondelete='CASCADE'), nullable=True),
        sa.Column('timestamp', sa.String(length=64), nullable=False),
        sa.Column('predicted_load', sa.Float(), nullable=False),
        sa.Column('lower_bound', sa.Float(), nullable=False),
        sa.Column('upper_bound', sa.Float(), nullable=False),
        sa.Column('actual_load', sa.Float(), nullable=True),
    )
    op.create_index('ix_predictions_project_id', 'predictions', ['project_id'])
    op.create_index('ix_predictions_timestamp', 'predictions', ['timestamp'])

    # 10. actuals_uploads
    op.create_table(
        'actuals_uploads',
        sa.Column('id', sa.String(length=64), primary_key=True),
        sa.Column('project_id', sa.String(length=64), sa.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False),
        sa.Column('file_path', sa.String(length=512), nullable=False),
        sa.Column('rows', sa.Integer(), nullable=False),
        sa.Column('start_ts', sa.DateTime(timezone=True), nullable=True),
        sa.Column('end_ts', sa.DateTime(timezone=True), nullable=True),
        sa.Column('uploaded_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_actuals_uploads_project_id', 'actuals_uploads', ['project_id'])

    # 11. forecast_scores
    op.create_table(
        'forecast_scores',
        sa.Column('id', sa.String(length=64), primary_key=True),
        sa.Column('run_id', sa.String(length=64), sa.ForeignKey('forecast_runs.id', ondelete='CASCADE'), nullable=False),
        sa.Column('project_id', sa.String(length=64), sa.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False),
        sa.Column('mae', sa.Float(), nullable=False),
        sa.Column('mape', sa.Float(), nullable=False),
        sa.Column('rmse', sa.Float(), nullable=False),
        sa.Column('scored_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_forecast_scores_project_id', 'forecast_scores', ['project_id'])

    # 12. anomalies
    op.create_table(
        'anomalies',
        sa.Column('id', sa.String(length=64), primary_key=True),
        sa.Column('project_id', sa.String(length=64), sa.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False),
        sa.Column('timestamp', sa.String(length=64), nullable=False),
        sa.Column('type', sa.String(length=32), nullable=False),
        sa.Column('severity', sa.String(length=16), nullable=False, server_default='medium'),
        sa.Column('residual', sa.Float(), nullable=True),
        sa.Column('status', sa.String(length=32), nullable=False, server_default='open'),
        sa.Column('exclude_from_training', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('detected_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_anomalies_project_id', 'anomalies', ['project_id'])

    # 13. drift_metrics
    op.create_table(
        'drift_metrics',
        sa.Column('id', sa.String(length=64), primary_key=True),
        sa.Column('project_id', sa.String(length=64), sa.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False),
        sa.Column('computed_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('feature', sa.String(length=128), nullable=False),
        sa.Column('psi', sa.Float(), nullable=True),
        sa.Column('ks_pvalue', sa.Float(), nullable=True),
        sa.Column('rolling_mape', sa.Float(), nullable=True),
        sa.Column('retrain_recommended', sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.create_index('ix_drift_metrics_project_id', 'drift_metrics', ['project_id'])

    # 14. api_keys
    op.create_table(
        'api_keys',
        sa.Column('id', sa.String(length=64), primary_key=True),
        sa.Column('project_id', sa.String(length=64), sa.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False),
        sa.Column('key_hash', sa.String(length=128), nullable=False),
        sa.Column('key_prefix', sa.String(length=16), nullable=False),
        sa.Column('label', sa.String(length=64), nullable=False, server_default='Default Key'),
        sa.Column('last_used_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('revoked_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_api_keys_project_id', 'api_keys', ['project_id'])
    op.create_index('ix_api_keys_key_hash', 'api_keys', ['key_hash'])

    # 15. audit_log
    op.create_table(
        'audit_log',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('user_id', sa.String(length=64), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('action', sa.String(length=64), nullable=False),
        sa.Column('entity', sa.String(length=64), nullable=False),
        sa.Column('entity_id', sa.String(length=64), nullable=True),
        sa.Column('details_json', sa.Text(), nullable=True),
        sa.Column('ip_address', sa.String(length=45), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_audit_log_user_id', 'audit_log', ['user_id'])

    # 16. notifications
    op.create_table(
        'notifications',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('user_id', sa.String(length=64), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('level', sa.String(length=16), nullable=False, server_default='info'),
        sa.Column('read', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_notifications_user_id', 'notifications', ['user_id'])

def downgrade() -> None:
    op.drop_table('notifications')
    op.drop_table('audit_log')
    op.drop_table('api_keys')
    op.drop_table('drift_metrics')
    op.drop_table('anomalies')
    op.drop_table('forecast_scores')
    op.drop_table('actuals_uploads')
    op.drop_table('predictions')
    op.drop_table('forecast_runs')
    op.drop_table('training_jobs')
    op.drop_table('model_registry')
    op.drop_table('quality_reports')
    op.drop_table('column_mappings')
    op.drop_table('project_files')
    op.drop_table('projects')
    op.drop_table('users')
