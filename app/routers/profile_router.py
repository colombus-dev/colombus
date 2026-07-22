import asyncio
import json
import logging
import re
import tempfile
import uuid
from pathlib import Path
from typing import Any, Sequence

from fastapi import APIRouter, File, HTTPException, Query, UploadFile
from pydantic import BaseModel
from sqlmodel import col, select

from app.constants import NOTEBOOK_FILE_EXTENSION, PROFILE_FILE_EXTENSION
from app.dependencies import DatabaseSession
from app.exceptions import ElementNotFoundException, UnsupportedTaxonomyException
from app.models.api_model import Profile as JsonProfile
from app.models.api_model import ProfileNodes
from app.models.sql_model import Profile
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
    is_kaggle_token_set,
    list_kaggle_competition_notebooks,
    pull_kaggle_notebooks,
)


@router.get("/api/project/{project_id}/profile/getAll")
async def get_all_profile(
    project_id: uuid.UUID,
    session: DatabaseSession,
) -> Sequence[str]:
    return session.exec(
        select(Profile.name).where(Profile.project_id == project_id)
    ).all()


@router.get("/api/project/{project_id}/profile/scores")
async def get_profiles_scores(
    project_id: uuid.UUID,
    session: DatabaseSession,
) -> dict[str, float | None]:
    results = session.exec(
        select(Profile.name, Profile.json_profile).where(
            Profile.project_id == project_id
        )
    ).all()
    # TODO : We delete profiles with the same name
    return {name: json_profile.get("score") for name, json_profile in results}


@router.get("/api/project/{project_id}/profile/getJson")
async def get_json_profile(
    project_id: uuid.UUID, profile_name: str, session: DatabaseSession
):
    return session.exec(
        select(Profile.json_profile).where(
            Profile.project_id == project_id, Profile.name == profile_name
        )
    ).all()


@router.get(
    "/api/project/{project_id}/profile/nodes",
    response_model=list[ProfileNodes],
)
async def get_all_nodes(
    project_id: uuid.UUID,
    session: DatabaseSession,
    names: list[str] = Query(None),
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


@router.get("/api/project/{project_id}/profile/get/{profile_id}")
async def get_profile(
    project_id: uuid.UUID,
    profile_id: uuid.UUID,
    session: DatabaseSession,
) -> JsonProfile:
    profile = session.exec(
        select(Profile).where(
            Profile.project_id == project_id, Profile.id == profile_id
        )
    ).one_or_none()
    if not profile:
        raise ElementNotFoundException("profile")
    return JsonProfile(
        name=profile.name,
        steps=[s for s in sorted(profile.steps, key=lambda step: step.position)],
    )


@router.post("/api/project/{project_id}/profile/import")
async def import_multiple_profile(
    project_id: uuid.UUID,
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


@router.delete("/api/project/{project_id}/profile/delete/{profile_id}")
async def delete_profile(
    project_id: uuid.UUID,
    profile_id: uuid.UUID,
    session: DatabaseSession,
):
    profile = session.exec(
        select(Profile).where(
            Profile.project_id == project_id, Profile.id == profile_id
        )
    ).one_or_none()
    if not profile:
        raise ElementNotFoundException("profile")
    session.delete(profile)
    session.commit()


@router.get("/api/kaggle/status")
async def get_kaggle_status():
    return {"available": is_kaggle_token_set()}


@router.get("/api/project/{project_id}/profile/kaggle/competitions")
async def search_kaggle_competitions(
    project_id: uuid.UUID,
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
        client._http_client._session.timeout = 5.0
        resp = client.search.search_api_client.list_entities(req)
    except (ValueError, OSError) as e:
        error_msg = str(e)
        raise HTTPException(
            status_code=400,
            detail=f"Kaggle API failed to list competitions: {error_msg}",
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


@router.get("/api/project/{project_id}/profile/kaggle/list")
async def list_kaggle_competition(
    project_id: uuid.UUID,
    competition: str,
):
    if not competition:
        raise HTTPException(status_code=400, detail="Missing competition slug")
    return await list_kaggle_competition_notebooks(competition)


@router.post("/api/project/{project_id}/profile/import/kaggle")
async def import_kaggle_competition(
    project_id: uuid.UUID,
    payload: ImportKagglePayload,
    session: DatabaseSession,
):
    if payload.slugs:
        return await pull_kaggle_notebooks(
            project_id, session, payload.slugs, payload.scores
        )

    if not payload.competition:
        raise HTTPException(status_code=400, detail="Missing competition or slugs")

    notebooks = await list_kaggle_competition_notebooks(payload.competition)
    slugs = [nb["ref"] for nb in notebooks[:10]]

    return await pull_kaggle_notebooks(project_id, session, slugs, payload.scores)
