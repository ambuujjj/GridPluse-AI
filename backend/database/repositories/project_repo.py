import uuid
from typing import List, Optional

from sqlalchemy.orm import Session

from backend.database.models import Project
from backend.database.repositories.base import BaseRepository


class ProjectRepository(BaseRepository[Project]):
    """
    Repository for Project entities with strict tenant isolation.
    Guarantees users can only access their own projects or the shared public demo project.
    """

    def __init__(self, db: Session):
        super().__init__(Project, db)

    def get_for_user(self, project_id: str, user_id: str) -> Optional[Project]:
        """
        Retrieves a project only if owned by user_id or marked as is_demo=True.
        Prevents unauthorized cross-tenant data access.
        """
        return (
            self.db.query(Project)
            .filter(
                (Project.id == project_id) &
                ((Project.owner_id == user_id) | (Project.is_demo == True)) # noqa: E712
            )
            .first()
        )

    def list_for_user(self, user_id: str, include_demo: bool = True) -> List[Project]:
        """
        Lists all projects belonging to the specified user, plus optional demo project.
        """
        query = self.db.query(Project)
        if include_demo:
            return query.filter(
                (Project.owner_id == user_id) | (Project.is_demo == True) # noqa: E712
            ).order_by(Project.created_at.desc()).all()
        else:
            return query.filter(Project.owner_id == user_id).order_by(Project.created_at.desc()).all()

    def create_project(
        self,
        owner_id: str,
        name: str,
        description: Optional[str] = None,
        feature_level: str = "L0",
        frequency: int = 60,
        unit: str = "MW",
        timezone: str = "UTC",
        country_holidays: str = "ES",
        is_demo: bool = False,
        project_id: Optional[str] = None,
    ) -> Project:
        pid = project_id or f"proj_{uuid.uuid4().hex[:12]}"
        project = Project(
            id=pid,
            owner_id=owner_id,
            name=name,
            description=description,
            feature_level=feature_level,
            frequency=frequency,
            unit=unit,
            timezone=timezone,
            country_holidays=country_holidays,
            status="draft",
            is_demo=is_demo,
        )
        return self.create(project)

    def delete_for_user(self, project_id: str, user_id: str) -> bool:
        """
        Deletes project only if user is the direct owner and not a protected demo project.
        """
        project = self.db.query(Project).filter(
            Project.id == project_id,
            Project.owner_id == user_id,
            Project.is_demo == False, # noqa: E712
        ).first()

        if project:
            self.delete(project)
            return True
        return False
