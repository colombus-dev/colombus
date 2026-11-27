from typing import cast

from sqlalchemy import CursorResult
from sqlmodel import Session, col, delete

from app.models.sql_model import Profile, Project


def delete_project_profiles(session: Session, project_id: int) -> None:
    session.execute(delete(Profile).where(col(Profile.project_id) == project_id))


def delete_project(session: Session, project_id: int) -> int:
    result = cast(
        CursorResult,
        session.execute(delete(Project).where(col(Project.id) == project_id)),
    )
    return result.rowcount
