import json
import uuid

from typing import Annotated, Any
from pathlib import Path

from fastapi import Depends, FastAPI, UploadFile, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlmodel import text, select, delete, Session

from app.models.api_model import ProfileNodes, PpmResult
from app.models.sql_model import (
    Project,
    Pattern,
    Profile,
    Step,
    MetaInstruction,
    Code,
    engine,
    create_db_and_tables,
)
from app.utils.save_notebook_sql import save_notebook_as_sql
from app.utils.convert_ppm_to_sql import convert_ppm_to_sql_query

app = FastAPI()

origins = [
    "http://localhost",
    "http://localhost:5173",
    "http://erebe-vm9.i3s.unice.fr",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    create_db_and_tables()


def get_session():
    with Session(engine) as session:
        yield session


API_KEY = "COL-0659-PROF"


class CheckApiKeyPayload(BaseModel):
    api_key: str


@app.post("/api/key")
async def check_api_key(
    payload: CheckApiKeyPayload,
    session: Session = Depends(get_session),
) -> str:
    if payload.api_key != API_KEY:
        raise HTTPException(
            status_code=403, detail="Invalid API KEY. Please contact project members."
        )
    return "ok"


class CreateNewProjectPayload(BaseModel):
    name: str
    api_key: str


@app.post("/api/project")
async def create_new_project(
    payload: CreateNewProjectPayload,
    session: Session = Depends(get_session),
) -> uuid.UUID:
    if payload.api_key != API_KEY:
        raise HTTPException(
            status_code=403, detail="Invalid API KEY. Please contact project members."
        )
    new_project = Project(name=payload.name)
    session.add(new_project)
    session.commit()
    return new_project.id


class PostProjectDetailsPayload(BaseModel):
    api_key: str


@app.post("/api/project/{project_id}/details")
async def post_retrieve_project_details(
    project_id: uuid.UUID,
    payload: PostProjectDetailsPayload,
    session: Session = Depends(get_session),
) -> str:
    if payload.api_key != API_KEY:
        raise HTTPException(
            status_code=403, detail="Invalid API KEY. Please contact project members."
        )
    res = session.exec(
        select(Project.name).where(Project.id == project_id)
    ).one_or_none()
    if not res:
        raise HTTPException(status_code=404, detail="Project not found.")
    return res


@app.get("/api/project/{project_id}/profile/getAll")
async def get_all_profile(
    project_id: uuid.UUID,
    session: Session = Depends(get_session),
) -> list[str]:
    return session.exec(
        select(Profile.name).where(Profile.project_id == project_id)
    ).all()


@app.get("/api/project/{project_id}/profile/getJson")
async def get_json_profile(
    project_id: uuid.UUID, profile_name: str, session: Session = Depends(get_session)
):
    return session.exec(
        select(Profile.json_profile).where(
            (Profile.project_id == project_id) & (Profile.name == profile_name)
        )
    ).all()


@app.get("/api/project/{project_id}/profile/nodes", response_model=list[ProfileNodes])
async def get_all_nodes(
    project_id: uuid.UUID,
    names: list[str] = Query(None),
    session: Session = Depends(get_session),
) -> list[ProfileNodes]:
    results = session.exec(
        select(Profile).where(
            (Profile.project_id == project_id) & (Profile.name.in_(names))
        )
    ).all()
    return [
        ProfileNodes(
            id=profile.id,
            name=profile.name,
            steps=profile.steps,
            meta_instructions=profile.meta_instructions,
            codes=profile.codes,
        )
        for profile in results
    ]


@app.post("/api/project/{project_id}/profile/import/multiple")
async def import_multiple_profile(
    project_id: uuid.UUID, profile_files: list[UploadFile]
):
    all_imported_profiles = []
    for profile_file in profile_files:
        profile_path = Path(profile_file.filename)
        profile_content = await profile_file.read()
        profile = json.loads(profile_content)
        save_notebook_as_sql(project_id, profile_path.stem, profile, engine)
        all_imported_profiles.append(profile_path.stem)
    return all_imported_profiles


@app.get("/api/project/{project_id}/ppm/getAll")
async def get_all_ppm(
    session: Session = Depends(get_session),
) -> list[tuple[str, list[dict[str, Any]]]]:
    return session.execute(select(Pattern.name, Pattern.json_pattern)).all()


@app.post("/api/project/{project_id}/ppm/execute")
async def execute_ppm(
    project_id: uuid.UUID,
    pattern: list[dict[str, Any]],
    session: Session = Depends(get_session),
) -> list[PpmResult]:
    query = convert_ppm_to_sql_query(project_id, pattern)
    # TODO: improve this uuid conversion
    return [
        PpmResult(
            profile_name=r[0],
            results=[
                [uuid.UUID(e) for e in f.split(",")] for f in r[1:] if f is not None
            ],
        )
        for r in session.exec(text(query)).all()
    ]


@app.post("/api/project/{project_id}/ppm/execute/{name}")
async def execute_ppm(
    project_id: uuid.UUID, name: str, session: Session = Depends(get_session)
) -> list[PpmResult]:
    ppm = session.execute(
        select(Pattern.json_pattern).where(
            (Pattern.project_id == project_id) & (Pattern.name == name)
        )
    ).scalar_one()
    query = convert_ppm_to_sql_query(project_id, ppm)
    # TODO: improve this uuid conversion
    return [
        PpmResult(
            profile_name=r[0],
            results=[
                [uuid.UUID(e) for e in f.split(",")] for f in r[1:] if f is not None
            ],
        )
        for r in session.exec(text(query)).all()
    ]


@app.post("/api/project/{project_id}/ppm/save/{name}")
async def save_ppm(
    project_id: uuid.UUID,
    name: str,
    pattern: list[dict[str, Any]],
    session: Session = Depends(get_session),
) -> str:
    retrieved_session_pattern = session.execute(
        select(Pattern).where(
            (Pattern.project_id == project_id) & (Pattern.name == name)
        )
    ).scalar_one_or_none()
    session_pattern = retrieved_session_pattern or Pattern(
        name=name, json_pattern=pattern
    )
    session_pattern.json_pattern = pattern
    session.add(session_pattern)
    session.commit()
    return session_pattern.name


@app.delete("/api/project/{project_id}/ppm/delete/{name}")
async def delete_ppm(
    project_id: uuid.UUID, name: str, session: Session = Depends(get_session)
):
    session.execute(
        delete(Pattern).where(
            (Pattern.project_id == project_id) & (Pattern.name == name)
        )
    )
    session.commit()
