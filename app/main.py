import json
import uuid

from typing import Annotated, Any
from pathlib import Path

from fastapi import Depends, FastAPI, UploadFile, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlmodel import text, select, delete, Session

from app.models.api_model import ProfileNodes, PpmResult
from app.models.sql_model import (
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


@app.get("/api/profile/getAll")
async def get_all_profile(session: Session = Depends(get_session)) -> list[str]:
    return session.exec(select(Profile.name)).all()


@app.get("/api/profile/getJson")
async def get_json_profile(profile_name: str, session: Session = Depends(get_session)):
    return session.exec(
        select(Profile.json_profile).where(Profile.name == profile_name)
    ).all()


@app.get("/api/profile/nodes", response_model=list[ProfileNodes])
async def get_all_nodes(
    names: list[str] = Query(None), session: Session = Depends(get_session)
) -> list[ProfileNodes]:
    results = session.exec(select(Profile).where(Profile.name.in_(names))).all()
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


@app.post("/api/profile/import/multiple")
async def import_multiple_profile(profile_files: list[UploadFile]):
    all_imported_profiles = []
    for profile_file in profile_files:
        profile_path = Path(profile_file.filename)
        profile_content = await profile_file.read()
        profile = json.loads(profile_content)
        save_notebook_as_sql(profile_path.stem, profile, engine)
        all_imported_profiles.append(profile_path.stem)
    return all_imported_profiles


@app.get("/api/ppm/getAll")
async def get_all_ppm(
    session: Session = Depends(get_session),
) -> list[tuple[str, list[dict[str, Any]]]]:
    return session.execute(select(Pattern.name, Pattern.json_pattern)).all()


@app.post("/api/ppm/execute")
async def execute_ppm(
    pattern: list[dict[str, Any]], session: Session = Depends(get_session)
) -> list[PpmResult]:
    query = convert_ppm_to_sql_query(pattern)
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


@app.post("/api/ppm/execute/{name}")
async def execute_ppm(
    name: str, session: Session = Depends(get_session)
) -> list[PpmResult]:
    ppm = session.execute(
        select(Pattern.json_pattern).where(Pattern.name == name)
    ).scalar_one()
    query = convert_ppm_to_sql_query(ppm)
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


@app.post("/api/ppm/save/{name}")
async def save_ppm(
    name: str,
    pattern: list[dict[str, Any]],
    session: Session = Depends(get_session),
) -> str:
    retrieved_session_pattern = session.execute(
        select(Pattern).where(Pattern.name == name)
    ).scalar_one_or_none()
    session_pattern = retrieved_session_pattern or Pattern(
        name=name, json_pattern=pattern
    )
    session_pattern.json_pattern = pattern
    session.add(session_pattern)
    session.commit()
    return session_pattern.name


@app.delete("/api/ppm/delete/{name}")
async def delete_ppm(name: str, session: Session = Depends(get_session)):
    session.execute(delete(Pattern).where(Pattern.name == name))
    session.commit()
