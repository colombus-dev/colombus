import uuid
from typing import Sequence

from fastapi import APIRouter, File, Query, UploadFile
from sqlmodel import col, select

from app.constants import NOTEBOOK_FILE_EXTENSION, PROFILE_FILE_EXTENSION
from app.dependencies import DatabaseSession
from app.exceptions import (
    ElementNotFoundException,
    UnsupportedTaxonomyException,
)
from app.models.api_model import Profile as JsonProfile
from app.models.api_model import ProfileNodes
from app.models.sql_model import Profile
from app.service.notebook import convert_to_profiles
from app.utils.file_helper import (
    check_files,
    get_file_contents
)
from app.utils.save_notebook_sql import (
    is_steps_taxonomy_supported,
    save_notebook_as_sql,
)


router = APIRouter()


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
) -> dict[str, float]:
    results = session.exec(
        select(Profile.name, Profile.json_profile).where(Profile.project_id == project_id)
    ).all()
    scores = {}
    for name, json_profile in results:
        score_val = 0.0
        if isinstance(json_profile, dict):
            score_val = json_profile.get("score", 0.0)
        elif isinstance(json_profile, str):
            import json
            try:
                parsed = json.loads(json_profile)
                score_val = parsed.get("score", 0.0)
            except Exception:
                pass
        scores[name] = score_val
    return scores


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


@router.post("/api/project/{project_id}/profile/import/multiple")
async def import_multiple_profile(
    project_id: uuid.UUID,
    session: DatabaseSession,
    profile_files: list[UploadFile] = File([]),
    notebook_files: list[UploadFile] = File([]),
):
    all_profiles_to_import = await convert_to_profiles(check_files(notebook_files, expected_file_extension=NOTEBOOK_FILE_EXTENSION))
    profile_file_contents = await get_file_contents(profile_files, expected_file_extension=PROFILE_FILE_EXTENSION)
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
