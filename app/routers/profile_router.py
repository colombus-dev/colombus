import logging

from fastapi import APIRouter, File, HTTPException, UploadFile
from sqlalchemy.orm import joinedload
from sqlmodel import select

from app.constants import NOTEBOOK_FILE_EXTENSION, PROFILE_FILE_EXTENSION
from app.dependencies import DatabaseSession
from app.exceptions import ElementNotFoundException, UnsupportedTaxonomyException
from app.models.api_model import (
    CodeNode,
    MetaInstructionNode,
    ProfileNodes,
    StepNode,
)
from app.models.api_model import Profile as JsonProfile
from app.models.sql_model import MetaInstruction, Profile
from app.service.notebook import convert_to_profiles
from app.settings import get_settings
from app.utils.file_helper import check_files, get_file_contents
from app.utils.save_notebook_sql import (
    is_steps_taxonomy_supported,
    save_notebook_as_sql,
)

router = APIRouter()
settings = get_settings()
logger = logging.getLogger(__name__)

from app.service.kaggle_service import (
    ImportKagglePayload,
    get_kaggle_api_and_client,
    is_kaggle_available,
    list_kaggle_competition_notebooks,
    pull_kaggle_notebooks,
)


def build_profile_nodes(profile: Profile) -> ProfileNodes:
    steps: list[StepNode] = []
    for instruction in profile.meta_instructions:
        meta_instruction = MetaInstructionNode(
            id=instruction.id,
            library=instruction.library,
            function=instruction.function,
            algorithm_family=instruction.algorithm_family,
            algorithm_name=instruction.algorithm_name,
            metric=instruction.metric,
            action=instruction.action,
            codes=[
                CodeNode(id=code.id, content=code.content) for code in instruction.codes
            ],
        )
        if len(steps) > 0 and steps[-1].name == instruction.step:
            steps[-1].meta_instructions.append(meta_instruction)
        else:
            steps.append(
                StepNode(name=instruction.step, meta_instructions=[meta_instruction])
            )
    return ProfileNodes(id=profile.id, name=profile.name, steps=steps)


@router.get("/api/projects/{project_id}/profiles/{profile_id}/nodes")
def get_profile_nodes(
    project_id: int,
    profile_id: int,
    session: DatabaseSession,
) -> ProfileNodes:
    profile = (
        session.exec(
            select(Profile)
            .where(Profile.id == profile_id, Profile.project_id == project_id)
            .options(
                joinedload(Profile.meta_instructions).joinedload(MetaInstruction.codes)
            )
        )
        .unique()
        .one_or_none()
    )
    if profile is None:
        raise ElementNotFoundException("profile")
    return build_profile_nodes(profile)


@router.post("/api/projects/{project_id}/profiles")
async def import_multiple_profile(
    project_id: int,
    session: DatabaseSession,
    profile_files: list[UploadFile] = File([]),
    notebook_files: list[UploadFile] = File([]),
):
    all_profiles_to_import = await convert_to_profiles(
        check_files(notebook_files, expected_file_extension=NOTEBOOK_FILE_EXTENSION)
    )
    profile_file_contents = await get_file_contents(
        profile_files, expected_file_extension=PROFILE_FILE_EXTENSION
    )
    for profile_file_content in profile_file_contents:
        profile = JsonProfile.model_validate_json(profile_file_content)
        if not is_steps_taxonomy_supported(profile):
            raise UnsupportedTaxonomyException()
        all_profiles_to_import.append(profile)

    for profile in all_profiles_to_import:
        # TODO ymu : SQL queries in a loop is horrible for performance, will fix this later
        save_notebook_as_sql(project_id, profile, session)
    session.commit()
    return [profile.name for profile in all_profiles_to_import]


@router.get("/api/kaggle/status")
def get_kaggle_status():
    return {"available": is_kaggle_available()}


@router.get("/api/projects/{project_id}/kaggle/competitions")
async def search_kaggle_competitions(
    project_id: int,
    search: str,
):
    if not search:
        raise HTTPException(status_code=400, detail="Missing search keyword")

    _, client = get_kaggle_api_and_client()

    from kagglesdk.search.types.search_api_service import (
        DocumentType,
        ListEntitiesFilters,
        ListEntitiesRequest,
    )

    req = ListEntitiesRequest()
    filters = ListEntitiesFilters()
    filters.query = search
    filters.document_types = [DocumentType.COMPETITION]
    req.filters = filters
    req.page_size = 20

    try:
        client._http_client._init_session()
        client._http_client._session.timeout = 5.0  # pyright: ignore[reportOptionalMemberAccess, reportAttributeAccessIssue]
        resp = client.search.search_api_client.list_entities(req)
    except (ValueError, OSError, RuntimeError) as e:
        raise HTTPException(
            status_code=400,
            detail=f"Kaggle API failed to list competitions: {e}",
        )

    results = []
    if resp and resp.documents:
        for doc in resp.documents:
            results.append(
                {
                    "ref": getattr(doc, "slug", ""),
                    "title": getattr(doc, "title", getattr(doc, "slug", "")),
                    "description": "",
                }
            )

    return results


@router.get("/api/projects/{project_id}/kaggle/notebooks")
async def list_kaggle_competition(
    project_id: int,
    competition: str,
    page_token: str | None = None,
):
    if not competition:
        raise HTTPException(status_code=400, detail="Missing competition slug")
    return await list_kaggle_competition_notebooks(competition, page_token)


@router.post("/api/projects/{project_id}/profiles/kaggle")
async def import_kaggle_competition(
    project_id: int,
    payload: ImportKagglePayload,
    session: DatabaseSession,
):
    if payload.slugs:
        return await pull_kaggle_notebooks(
            project_id, session, payload.slugs, payload.scores
        )

    if not payload.competition:
        raise HTTPException(status_code=400, detail="Missing competition or slugs")

    result = await list_kaggle_competition_notebooks(payload.competition)
    slugs = [nb["ref"] for nb in result["notebooks"][:10]]

    return await pull_kaggle_notebooks(project_id, session, slugs, payload.scores)
