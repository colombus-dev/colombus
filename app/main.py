import json
import uuid

from typing import Annotated, Any
from pathlib import Path

from fastapi import Depends, FastAPI, UploadFile, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlmodel import text, select, delete, Session

from app.models.api_model import (
    ProfileNodes,
    Profile as JsonProfile,
    PpmResult,
    PatternGroup,
    Pattern as PatternApi,
    RegexCompatibleProfileElement,
)
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
from app.utils.convert_ppm_to_regex import convert_pattern_to_regex

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

notebooks_storage_path = Path("./data/notebooks")


@app.on_event("startup")
def on_startup():
    notebooks_storage_path.mkdir(parents=True, exist_ok=True)
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


class PostNotebooksPayload(BaseModel):
    api_key: str
    notebook_files: list[UploadFile]


@app.post("/api/project/{project_id}/notebook/upload/multiple")
async def post_notebooks(
    project_id: uuid.UUID,
    payload: PostNotebooksPayload,
    session: Session = Depends(get_session),
) -> str:
    if payload.api_key != API_KEY:
        raise HTTPException(
            status_code=403, detail="Invalid API KEY. Please contact project members."
        )

    if not all(Path(p).suffix == ".ipynb" for p in payload.notebook_files):
        raise HTTPException(status_code=404, detail="Unsupported files.")

    for file in payload.notebook_files:
        path_file = Path(file)
        with open(notebooks_storage_path / path_file.name, "w") as f:
            file_content = await file.read()
            f.write(file_content)

    return "ok"


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
        profile = JsonProfile.model_validate_json(profile_content)
        save_notebook_as_sql(project_id, profile_path.stem, profile, engine)
        all_imported_profiles.append(profile_path.stem)
    return all_imported_profiles


@app.delete("/api/project/{project_id}/profile/delete/{profile_id}")
async def delete_profile(
    project_id: uuid.UUID,
    profile_id: uuid.UUID,
    session: Session = Depends(get_session),
):
    session.execute(
        delete(Profile).where(
            (Profile.project_id == project_id) & (Profile.id == profile_id)
        )
    )
    session.commit()


@app.get("/api/project/{project_id}/ppm/getAll")
async def get_all_ppm(
    project_id, session: Session = Depends(get_session),
) -> list[PatternApi]:
    return [res[0] for res in session.execute(select(Pattern.json_pattern).where(Pattern.project_id == project_id).order_by(Pattern.name)).all()]


@app.post("/api/project/{project_id}/ppm/execute")
async def execute_ppm(
    project_id: uuid.UUID,
    pattern: list[PatternGroup],
    session: Session = Depends(get_session),
) -> list[PpmResult]:
    query = convert_ppm_to_sql_query(project_id, pattern)
    # TODO: improve this uuid conversion
    return [
        PpmResult(
            profile_name=r[0],
            results=[[e for e in f if e is not None] for f in r[1:] if f is not None],
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
    query = convert_ppm_to_sql_query(project_id, PatternGroup(**ppm))
    # TODO: improve this uuid conversion
    return [
        PpmResult(
            profile_name=r[0],
            results=[
                [
                    (uuid.UUID(e) if isinstance(e, str) else e)
                    for e in (f.split(",") if isinstance(f, str) else [f])
                ]
                for f in r[1:]
                if f is not None
            ],
        )
        for r in session.exec(text(query)).all()
    ]


@app.post("/api/project/{project_id}/ppm/save/{name}")
async def save_ppm(
    project_id: uuid.UUID,
    name: str,
    pattern: PatternApi,
    session: Session = Depends(get_session),
) -> str:
    retrieved_session_pattern = session.execute(
        select(Pattern).where(
            (Pattern.project_id == project_id) & (Pattern.name == name)
        )
    ).scalar_one_or_none()
    session_pattern = retrieved_session_pattern or Pattern(
        project_id=project_id, name=name, json_pattern=pattern.dict()
    )
    session_pattern.json_pattern = pattern.dict()
    session.add(session_pattern)
    session.commit()
    return session_pattern.name


# TODO: change name to pattern_id in delete operation
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


@app.post("/api/utils/generate/regex/pattern")
async def generate_pattern_regex(
    project_id: uuid.UUID, pattern: list[PatternGroup]
) -> str:
    return convert_pattern_to_regex(pattern)


@app.post("/api/utils/generate/regex/profile")
async def generate_profile_regex(
    project_id: uuid.UUID, profile: JsonProfile
) -> list[RegexCompatibleProfileElement]:
    return [
        RegexCompatibleProfileElement(
            step=se["name"],
            algoFamily=mi["algoFamily"],
            algoName=mi["algoName"],
            library=mi["library"],
            function=mi["function"],
        )
        for se in profile.source
        for mi in se["tasks"]
    ]
