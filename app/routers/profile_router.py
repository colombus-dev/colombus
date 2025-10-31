from typing import Sequence
import uuid
from fastapi import APIRouter, Query, UploadFile
from sqlmodel import col, select

from app.dependencies import DatabaseSession
from app.exceptions import ElementNotFoundException, UnsupportedTaxonomyException
from app.models.api_model import ProfileNodes, Profile as JsonProfile
from app.models.sql_model import Profile
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
    "/api/project/{project_id}/profile/nodes", response_model=list[ProfileNodes]
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
    profile_files: list[UploadFile],
    session: DatabaseSession,
):
    all_profiles_to_import: list[JsonProfile] = []
    for profile_file in profile_files:
        profile_content = await profile_file.read()
        profile = JsonProfile.model_validate_json(profile_content)
        if not is_steps_taxonomy_supported(profile):
            raise UnsupportedTaxonomyException()
        all_profiles_to_import.append(profile)
    for profile in all_profiles_to_import:
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
