import uuid
from pathlib import Path

from fastapi import APIRouter, UploadFile
from pydantic import BaseModel
from sqlmodel import select

from app.constants import notebooks_storage_path, NOTEBOOK_FILE_EXTENSION
from app.dependencies import DatabaseSession
from app.exceptions import (
    ElementNotFoundException,
    UnsupportedFilesException,
)
from app.models.sql_model import Project


router = APIRouter()


class CreateNewProjectPayload(BaseModel):
    name: str


@router.post("/api/project")
async def create_new_project(
    payload: CreateNewProjectPayload,
    session: DatabaseSession,
) -> uuid.UUID:
    new_project = Project(name=payload.name)
    session.add(new_project)
    session.commit()
    return new_project.id


@router.post("/api/project/{project_id}/details")
async def post_retrieve_project_details(
    project_id: uuid.UUID,
    session: DatabaseSession,
) -> str:
    res = session.exec(
        select(Project.name).where(Project.id == project_id)
    ).one_or_none()
    if not res:
        raise ElementNotFoundException("project")
    return res


class PostNotebooksPayload(BaseModel):
    notebook_files: list[UploadFile]


@router.post("/api/project/{project_id}/notebook/upload/multiple")
async def post_notebooks(
    project_id: uuid.UUID,
    payload: PostNotebooksPayload,
) -> str:
    for file in payload.notebook_files:
        if not file.filename.lower().endswith(NOTEBOOK_FILE_EXTENSION):
            # TODO: replace with dependency (magic lib shall do the job)
            raise UnsupportedFilesException(expected_file_extension=NOTEBOOK_FILE_EXTENSION)

    for file in payload.notebook_files:
        path_file = Path(file)
        with open(notebooks_storage_path / path_file.name, "w") as f:
            file_content = await file.read()
            f.write(file_content)

    return "ok"
