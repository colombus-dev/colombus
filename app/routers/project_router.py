import uuid
from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, UploadFile, status
from pydantic import BaseModel, StringConstraints
from sqlmodel import col, select

from app.constants import NOTEBOOK_FILE_EXTENSION, notebooks_storage_path
from app.dependencies import DatabaseSession
from app.exceptions import ElementNotFoundException
from app.models.sql_model import Profile, Project
from app.service import project_service
from app.utils.file_helper import check_files

router = APIRouter()


class ProjectNamePayload(BaseModel):
    name: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]


@router.post("/api/projects")
async def create_new_project(
    payload: ProjectNamePayload,
    session: DatabaseSession,
) -> uuid.UUID:
    new_project = Project(name=payload.name)
    session.add(new_project)
    session.commit()
    return new_project.id


class ProfileSummary(BaseModel):
    name: str
    score: float | None


class ProjectDetails(BaseModel):
    id: uuid.UUID
    name: str
    profiles: list[ProfileSummary]


@router.get("/api/projects/{project_id}")
def get_project(project_id: uuid.UUID, session: DatabaseSession) -> ProjectDetails:
    project = session.get(Project, project_id)
    if project is None:
        raise ElementNotFoundException("project")
    score = col(Profile.json_profile)["score"].as_float()
    rows = session.exec(
        select(Profile.name, score)
        .where(Profile.project_id == project_id)
        .order_by(col(Profile.name))
    ).all()
    return ProjectDetails(
        id=project.id,
        name=project.name,
        profiles=[ProfileSummary(name=name, score=value) for name, value in rows],
    )


@router.patch("/api/projects/{project_id}")
def rename_project(
    project_id: uuid.UUID,
    payload: ProjectNamePayload,
    session: DatabaseSession,
) -> str:
    project = session.get(Project, project_id)
    if project is None:
        raise ElementNotFoundException("project")
    project.name = payload.name
    session.add(project)
    session.commit()
    return project.name


@router.delete("/api/projects/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(project_id: uuid.UUID, session: DatabaseSession) -> None:
    if project_service.delete_project(session, project_id) == 0:
        raise ElementNotFoundException("project")
    session.commit()


class PostNotebooksPayload(BaseModel):
    notebook_files: list[UploadFile]


@router.post("/api/projects/{project_id}/notebooks")
async def post_notebooks(
    project_id: uuid.UUID,
    payload: PostNotebooksPayload,
) -> str:
    notebook_files = check_files(payload.notebook_files, NOTEBOOK_FILE_EXTENSION)
    for file in notebook_files:
        path_file = Path(file)
        with open(notebooks_storage_path / path_file.name, "w") as f:
            file_content = await file.read()
            f.write(file_content)

    return "ok"


class ProjectResponse(BaseModel):
    id: uuid.UUID
    name: str


@router.get("/api/projects", response_model=list[ProjectResponse])
def get_all_projects(session: DatabaseSession):
    return session.exec(select(Project)).all()
