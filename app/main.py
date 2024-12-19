import json

from typing import Annotated
from pathlib import Path

from fastapi import BackgroundTasks, FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session

from app.models.sql_model import Base
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


engine = create_engine(
    "mysql+pymysql://christopher:pinta@colombus_mysql:3306/colombusdb",
    echo=False,
)
# engine = create_engine("sqlite:///db.sqlite", echo=False)

Base.metadata.create_all(engine)


@app.post("/api/profile/import")
async def import_profile(
    profile_file: Annotated[UploadFile, File()], background_tasks: BackgroundTasks
):
    profile_path = Path(profile_file.filename)
    profile_content = await profile_file.read()
    profile = json.loads(profile_content)
    save_notebook_as_sql(profile_path.stem, profile, engine)
    background_tasks.add_task(
        save_notebook_as_graph,
        notebook_name=profile_path.stem,
        profile=profile,
    )
    return {"status": "ok"}


@app.post("/api/profile/import/multiple")
async def import_multiple_profile(
    profile_files: list[UploadFile], background_tasks: BackgroundTasks
):
    for profile_file in profile_files:
        profile_path = Path(profile_file.filename)
        profile_content = await profile_file.read()
        profile = json.loads(profile_content)
        save_notebook_as_sql(profile_path.stem, profile, engine)
        background_tasks.add_task(
            save_notebook_as_graph,
            notebook_name=profile_path.stem,
            profile=profile,
        )
    return {"status": "ok"}


@app.post("/api/ppm/execute")
async def execute_ppm(ppm_file: Annotated[UploadFile, File()]) -> list[str]:
    ppm_content = await ppm_file.read()
    ppm = json.loads(ppm_content)
    query = convert_ppm_to_sql_query(ppm)
    with Session(engine) as session:
        return [r[0] for r in session.execute(text(query)).all()]
