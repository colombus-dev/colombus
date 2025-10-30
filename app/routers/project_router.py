from pathlib import Path
import uuid
from fastapi import APIRouter, UploadFile
from pydantic import BaseModel
from sqlmodel import select

from app.constants import API_KEY, notebooks_storage_path
from app.dependencies import DatabaseSession
from app.exceptions import (
    ElementNotFoundException,
    InvalidApiKeyException,
    UnsupportedFilesException,
)
from app.models.sql_model import Project


router = APIRouter()


class CreateNewProjectPayload(BaseModel):
    name: str
    api_key: str


@router.post("/api/project")
async def create_new_project(
    payload: CreateNewProjectPayload,
    session: DatabaseSession,
) -> uuid.UUID:
    if payload.api_key != API_KEY:
        raise InvalidApiKeyException()
    new_project = Project(name=payload.name)
    session.add(new_project)
    session.commit()
    return new_project.id


class PostProjectDetailsPayload(BaseModel):
    api_key: str


@router.post("/api/project/{project_id}/details")
async def post_retrieve_project_details(
    project_id: uuid.UUID,
    payload: PostProjectDetailsPayload,
    session: DatabaseSession,
) -> str:
    if payload.api_key != API_KEY:
        raise InvalidApiKeyException()
    res = session.exec(
        select(Project.name).where(Project.id == project_id)
    ).one_or_none()
    if not res:
        raise ElementNotFoundException("project")
    return res


class PostNotebooksPayload(BaseModel):
    api_key: str
    notebook_files: list[UploadFile]


@router.post("/api/project/{project_id}/notebook/upload/multiple")
async def post_notebooks(
    project_id: uuid.UUID,
    payload: PostNotebooksPayload,
) -> str:
    if payload.api_key != API_KEY:
        raise InvalidApiKeyException()

    if not all(Path(p).suffix == ".ipynb" for p in payload.notebook_files):
        # TODO: replace with dependency
        raise UnsupportedFilesException()

    for file in payload.notebook_files:
        path_file = Path(file)
        with open(notebooks_storage_path / path_file.name, "w") as f:
            file_content = await file.read()
            f.write(file_content)

    return "ok"
