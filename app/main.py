import json

from typing import Annotated, Any
from pathlib import Path

from fastapi import BackgroundTasks, FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text, select, delete
from sqlalchemy.orm import Session

from app.models.sql_model import Base, Pattern, Profile, engine
from app.utils.save_notebook_sql import save_notebook_as_sql
from app.utils.convert_ppm_to_sql import convert_ppm_to_sql_query
from app.utils.save_notebook_graph import save_notebook_as_graph

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


@app.get("/api/profile/getAll")
async def get_all_profile() -> list[str]:
    with Session(engine) as session:
        return session.execute(select(Profile.name)).scalars().all()


@app.get("/api/profile/getJson")
async def get_json_profile(profile_name: str):
    with Session(engine) as session:
        return (
            session.execute(
                select(Profile.json_profile).where(Profile.name == profile_name)
            )
            .scalars()
            .all()
        )


@app.post("/api/profile/import/multiple")
async def import_multiple_profile(
    profile_files: list[UploadFile], background_tasks: BackgroundTasks
):
    all_imported_profiles = []
    for profile_file in profile_files:
        profile_path = Path(profile_file.filename)
        profile_content = await profile_file.read()
        profile = json.loads(profile_content)
        save_notebook_as_sql(profile_path.stem, profile, engine)
        background_tasks.add_task(
            save_notebook_as_graph,
            notebook_name=profile_path.stem,
            raw_profile=profile,
        )
        all_imported_profiles.append(profile_path.stem)
    return all_imported_profiles


@app.get("/api/ppm/getAll")
async def get_all_ppm() -> list[tuple[str, list[str | dict[str, Any]]]]:
    with Session(engine) as session:
        return session.execute(select(Pattern.name, Pattern.json_pattern)).all()


@app.post("/api/ppm/execute")
async def execute_ppm(ppm_file: Annotated[UploadFile, File()]) -> list[tuple[str, ...]]:
    ppm_content = await ppm_file.read()
    ppm = json.loads(ppm_content)
    query = convert_ppm_to_sql_query(ppm)
    with Session(engine) as session:
        return session.execute(text(query)).all()


@app.post("/api/ppm/execute/{name}")
async def execute_ppm(name: str) -> list[tuple[str, ...]]:
    with Session(engine) as session:
        ppm = session.execute(select(Pattern.json_pattern).where(Pattern.name == name))
        query = convert_ppm_to_sql_query(ppm)
        with Session(engine) as session:
            return session.execute(text(query)).all()


@app.post("/api/ppm/save/{name}")
async def save_ppm(name: str, ppm_file: Annotated[UploadFile, File()]) -> str:
    ppm_content = await ppm_file.read()
    ppm = json.loads(ppm_content)
    with Session(engine) as session:
        pattern = Pattern(name=name, json_pattern=ppm)
        session.add(pattern)
        session.commit()
        return pattern.name


@app.delete("/api/ppm/delete/{name}")
async def delete_ppm(name: str):
    with Session(engine) as session:
        session.execute(delete(Pattern).where(Pattern.name == name))
        session.commit()
