from io import BytesIO
import uuid
from typing import Sequence

from difflib import SequenceMatcher
from pathlib import Path

from fastapi import Depends, FastAPI, UploadFile, Query, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlmodel import col, func, text, select, delete, Session

from app.models.api_model import (
    ProfileNodes,
    Profile as JsonProfile,
    PpmResult,
    PatternGroup,
    Pattern as PatternApi,
    RegexCompatibleProfileElement,
    DiffResult,
)
from app.models.sql_model import (
    Project,
    Pattern,
    Profile,
    Step,
    CellOutput,
    engine,
    create_db_and_tables,
)
from app.utils import __TMP_ENCODING_MAPPING
from app.utils.save_notebook_sql import save_notebook_as_sql
from app.utils.convert_ppm_to_sql import convert_ppm_to_sql_query
from app.utils.convert_ppm_to_regex import convert_pattern_to_regex
from app.utils.diff_stats_exploration import get_frequent_patterns_matrix

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
) -> Sequence[str]:
    return session.exec(
        select(Profile.name).where(Profile.project_id == project_id)
    ).all()


@app.get("/api/project/{project_id}/profile/getJson")
async def get_json_profile(
    project_id: uuid.UUID, profile_name: str, session: Session = Depends(get_session)
):
    return session.exec(
        select(Profile.json_profile).where(
            Profile.project_id == project_id, Profile.name == profile_name
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
            Profile.project_id == project_id, col(Profile.name).in_(names)
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
    all_imported_profiles: list[str] = []
    for profile_file in profile_files:
        if not profile_file.filename:
            continue
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
    profile = session.exec(
        select(Profile).where(
            Profile.project_id == project_id, Profile.id == profile_id
        )
    ).one_or_none()
    if not profile:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Profile not found.")
    session.delete(profile)
    session.commit()


@app.get("/api/project/{project_id}/ppm/getAll")
async def get_all_ppm(
    project_id: str,
    session: Session = Depends(get_session),
) -> Sequence[PatternApi]:
    return session.exec(
        select(Pattern.json_pattern)
        .where(Pattern.project_id == project_id)
        .order_by(Pattern.name)
    ).all()


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
    retrieved_session_pattern = session.exec(
        select(Pattern).where(Pattern.project_id == project_id, Pattern.name == name)
    ).one_or_none()
    session_pattern = retrieved_session_pattern or Pattern(
        project_id=project_id, name=name, json_pattern={}
    )
    session_pattern.json_pattern = pattern.model_dump()
    session.add(session_pattern)
    session.commit()
    return session_pattern.name


# TODO: change name to pattern_id in delete operation
@app.delete("/api/project/{project_id}/ppm/delete/{name}")
async def delete_ppm(
    project_id: uuid.UUID, name: str, session: Session = Depends(get_session)
):
    pattern = session.exec(
        select(Pattern).where(Pattern.project_id == project_id, Pattern.name == name)
    ).one_or_none()
    if not pattern:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Pattern not found.")
    session.delete(pattern)
    session.commit()


@app.get("/api/project/{project_id}/profile/step/{step_id}/output")
async def get_step_output(
    project_id: uuid.UUID,
    step_id: uuid.UUID,
    session: Session = Depends(get_session),
) -> Sequence[str]:
    return session.exec(
        select(CellOutput.image).where(CellOutput.step_id == step_id)
    ).all()


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


class PostDiffSortPayload(BaseModel):
    profiles_to_diff: list[str]


@app.post("/api/utils/diff/sort")
async def post_diff_sort(
    payload: PostDiffSortPayload, session: Session = Depends(get_session)
) -> list[DiffResult]:
    if len(payload.profiles_to_diff) == 1:
        return []

    profiles_ids: list[uuid.UUID] = []
    for ptd in payload.profiles_to_diff:
        profile_id = session.exec(select(Profile.id).where(Profile.name == ptd)).first()
        if profile_id:
            profiles_ids.append(profile_id)

    profiles_content: list[Sequence[tuple[uuid.UUID, str]]] = []
    for pid in profiles_ids:
        profiles_content.append(
            session.exec(select(Step.id, Step.name).where(Step.profile_id == pid)).all()
        )

    results: list[DiffResult] = []
    ref_element = "-".join(
        [__TMP_ENCODING_MAPPING[pe[1]] for pe in profiles_content[0]]
    )
    seq_match = SequenceMatcher(isjunk=None, a=ref_element)

    i = 0
    for ptd, pc in zip(payload.profiles_to_diff, profiles_content):
        seq_match.set_seq2("-".join([__TMP_ENCODING_MAPPING[pe[1]] for pe in pc]))
        results.append(
            DiffResult(
                profile_name=ptd,
                results=[
                    [e[0] for e in profiles_content[i][b[1] : b[1] + b[2]]]
                    for b in seq_match.get_matching_blocks()[:-1]
                ],
                ratio=seq_match.ratio(),
            )
        )
        i += 1

    return sorted(results, key=lambda r: r.ratio, reverse=True)


@app.get("/api/project/{project_id}/stats")
async def get_project_stats(project_id: str, session: Session = Depends(get_session)):

    from itertools import groupby

    profiles_content = session.exec(
        select(Profile.name, Step.id, Step.name)
        .join(Step)
        .where(Profile.project_id == project_id)
        .order_by(Profile.name)
    ).all()

    get_grouped_profiles_content = lambda: groupby(profiles_content, lambda e: e[0])

    results: list[DiffResult] = []

    # retrieving matching groups for each profile compared to each other profile

    for profile_id_1, profile_steps_1_iter in get_grouped_profiles_content():
        profile_steps_1 = list(profile_steps_1_iter)
        for profile_id_2, profile_steps_2_iter in get_grouped_profiles_content():
            if profile_id_1 == profile_id_2:
                continue
            profile_steps_2 = list(profile_steps_2_iter)
            elem_a = "".join(__TMP_ENCODING_MAPPING[pe[2]] for pe in profile_steps_1)
            elem_b = "".join(__TMP_ENCODING_MAPPING[pe[2]] for pe in profile_steps_2)
            seq_match = SequenceMatcher(None, elem_a, elem_b, autojunk=False)
            results.append(
                {
                    "profile_name": f"{profile_id_1}_-TO-_{profile_id_2}",
                    "results": [
                        [
                            (e[2], block)
                            for e in profile_steps_2[block.b : block.b + block.size]
                        ]
                        for block in seq_match.get_matching_blocks()[:-1]
                    ],
                    "ratio": seq_match.ratio(),
                }
            )

    return sorted(results, key=lambda r: r["ratio"], reverse=True)


class PostStatsProfilesFilterPayload(BaseModel):
    profiles_names: list[str] | None = None


@app.post("/api/project/{project_id}/stats/patterns")
async def post_project_stats_patterns(
    project_id: str,
    payload: PostStatsProfilesFilterPayload,
    session: Session = Depends(get_session),
):
    if payload.profiles_names:
        nb_profiles = len(payload.profiles_names)
    else:
        nb_profiles = session.exec(select(func.count(col(Profile.id)))).one()

    query = (
        select(Profile.name, Step.id, Step.name)
        .join(Step)
        .where(Profile.project_id == project_id)
    )
    if payload.profiles_names:
        query = query.where(col(Profile.name).in_(payload.profiles_names))
    query = query.order_by(Profile.name, col(Step.position))
    profiles_content = session.exec(query).all()

    freq_patterns_matrix = get_frequent_patterns_matrix(profiles_content)

    import matplotlib.pyplot as plt
    import seaborn as sns

    MAX_NB_PATTERNS = 30
    HEAT_THRESHOLD = round(nb_profiles * 1)

    plt.figure(figsize=(12, 6), dpi=100)

    sns.heatmap(
        freq_patterns_matrix[:MAX_NB_PATTERNS],
        yticklabels=freq_patterns_matrix[:MAX_NB_PATTERNS].index,
        vmax=HEAT_THRESHOLD,
    )
    plt.title("Heatmap of patterns occurences in the selected profiles", fontsize=10)
    plt.xlabel("Position in the profile (in %)", fontsize=10)
    plt.ylabel("Pattern", fontsize=10)

    plt.tight_layout()
    buf = BytesIO()
    plt.savefig(buf, format="png")
    buf.seek(0)

    return StreamingResponse(buf, media_type="image/png")


@app.post("/api/project/{project_id}/stats/steps/frequency")
async def post_steps_frequency(
    project_id: str,
    payload: PostStatsProfilesFilterPayload,
    session: Session = Depends(get_session),
) -> Sequence[tuple[str, int]]:
    query = (
        select(Step.name, func.count(col(Step.id)))
        .join(Profile)
        .where(Profile.project_id == project_id)
    )
    if payload.profiles_names:
        query = query.where(col(Profile.name).in_(payload.profiles_names))
    query = query.group_by(Step.name)
    return session.exec(query).all()


@app.get(
    "/health",
    tags=["healthcheck"],
    summary="Perform a Health Check",
    response_description="Return HTTP Status Code 200 (OK)",
    status_code=status.HTTP_200_OK,
)
def get_health():
    return "OK"
