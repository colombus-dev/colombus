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

from kaggle.api.kaggle_api_extended import KaggleApi
from kagglesdk.search.types.search_api_service import (
    DocumentType,
    ListEntitiesFilters,
    ListEntitiesRequest,
)


def _get_kaggle_api_and_client():
    try:
        api = KaggleApi()
        api.authenticate()
        client = api.build_kaggle_client()
        return api, client
    except (Exception, SystemExit) as e:
        import traceback

        traceback.print_exc()
        logger.error(f"Kaggle authentication failed: {e}")
        raise HTTPException(
            status_code=400,
            detail=f"Kaggle authentication failed. Please check your KAGGLE_API_TOKEN. Error: {e}",
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


class ImportKagglePayload(BaseModel):
    competition: str | None = None
    slugs: list[str] | None = None
    scores: dict[str, float] | None = None


class MockUploadFile:
    def __init__(self, filename: str, content: bytes):
        self.filename = filename
        self._content = content
        self.content_type = "application/json"

    @property
    def content(self) -> bytes:
        return self._content

    async def read(self):
        return self._content


def _download_kaggle_notebooks(
    api, slugs: list[str], tmp_dir: str
) -> list[MockUploadFile]:
    tmp_path = Path(tmp_dir)
    mock_files = []
    for raw_slug in slugs:
        slug = raw_slug.strip()
        match = re.search(r"kaggle\.com/code/([^/]+/[^/?#]+)", slug)
        if match:
            slug = match.group(1)

        logger.info(f"Pulling kaggle notebook {slug}")
        try:
            api.kernels_pull(slug, path=tmp_dir)
        except Exception as e:
            import traceback

            traceback.print_exc()
            print(f"ERROR: Failed to pull {slug}: {str(e)}", flush=True)
            logger.warning(f"Failed to pull {slug}: {str(e)}")
            continue

        nb_files = list(tmp_path.glob("*.ipynb")) + list(tmp_path.glob("*.irnb"))
        for nb_file in nb_files:
            with open(nb_file, "rb") as f:
                content = f.read()
            slug_safe = slug.replace("/", "---")
            new_filename = f"{slug_safe}_____{nb_file.with_suffix('.ipynb').name}"
            mock_files.append(MockUploadFile(filename=new_filename, content=content))
            nb_file.unlink()

    return mock_files


async def _pull_kaggle_notebooks(
    project_id: uuid.UUID,
    session: DatabaseSession,
    slugs: list[str],
    scores: dict[str, float] | None = None,
) -> list[str]:
    api, _ = _get_kaggle_api_and_client()

    with tempfile.TemporaryDirectory() as tmp_dir:
        mock_files = _download_kaggle_notebooks(api, slugs, tmp_dir)

        if not mock_files:
            logger.error(
                f"No notebooks downloaded successfully. Slugs attempted: {slugs}"
            )
            raise HTTPException(
                status_code=400, detail="Failed to download any notebooks."
            )

        logger.info(
            f"Converting {len(mock_files)} notebooks to profiles via mlprofiler..."
        )
        profiles = await convert_to_profiles(mock_files)
        logger.info(f"✓ Successfully profiled {len(profiles)} notebooks")

        for profile in profiles:
            if "_____" in profile.name:
                slug_safe, original_name = profile.name.split("_____", 1)
                profile.name = original_name
                slug = slug_safe.replace("---", "/")
                if scores and slug in scores:
                    profile.score = scores[slug]
            save_notebook_as_sql(project_id, profile, session)
        session.commit()

        return [profile.name for profile in profiles]


async def _get_kaggle_scores(competition: str) -> dict[str, float]:
    """Fetch notebook scores from Kaggle's official search API using the OIDC/legacy client."""
    try:
        _, client = _get_kaggle_api_and_client()
    except HTTPException:
        logger.warning("Failed to build KaggleClient for score fetching")
        return {}

    req = ListEntitiesRequest()
    filters = ListEntitiesFilters()
    filters.query = competition
    filters.document_types = [DocumentType.KERNEL]
    req.filters = filters
    req.page_size = 50

    try:
        client._http_client._init_session()
        client._http_client._session.timeout = 5.0
        resp = client.search.search_api_client.list_entities(req)
    except Exception as e:
        logger.warning(f"Failed to query Kaggle Search list_entities: {e}")
        return {}

    scores = {}
    if resp and resp.documents:
        for doc in resp.documents:
            author = doc.owner_user.user_name if doc.owner_user else None
            ref = f"{author}/{doc.slug}" if author else doc.slug
            score_val = (
                doc.kernel_document.best_public_score if doc.kernel_document else None
            )
            if ref and score_val is not None:
                try:
                    scores[ref] = float(score_val)
                except (ValueError, TypeError):
                    pass
    return scores


async def _list_kaggle_competition_notebooks(competition: str) -> list[dict[str, Any]]:
    _, client = _get_kaggle_api_and_client()

    req = ListEntitiesRequest()
    filters = ListEntitiesFilters()
    filters.query = competition
    filters.document_types = [DocumentType.KERNEL]
    req.filters = filters
    req.page_size = 50

    try:
        client._http_client._init_session()
        client._http_client._session.timeout = 5.0
        resp = client.search.search_api_client.list_entities(req)
    except Exception as e:
        error_msg = str(e)
        raise HTTPException(
            status_code=400,
            detail=f"Kaggle API failed to list kernels: {error_msg}",
        )

    try:
        scores = await _get_kaggle_scores(competition)
    except Exception as e:
        logger.warning(f"Failed to fetch Kaggle scores automatically: {e}")
        scores = {}

    notebooks = []
    if resp and resp.documents:
        for doc in resp.documents:
            author = doc.owner_user.user_name if doc.owner_user else None
            ref = f"{author}/{doc.slug}" if author else getattr(doc, "slug", "")
            title = getattr(doc, "title", getattr(doc, "slug", ""))

            notebooks.append(
                {
                    "ref": ref,
                    "title": title,
                    "author": author or "",
                    "score": scores.get(ref),
                }
            )

    if not notebooks:
        raise HTTPException(
            status_code=400, detail="No notebooks found for this competition."
        )

    return notebooks


@router.get("/api/project/{project_id}/profile/kaggle/competitions")
async def search_kaggle_competitions(
    project_id: uuid.UUID,
    search: str,
):
    if not search:
        raise HTTPException(status_code=400, detail="Missing search keyword")

    _, client = _get_kaggle_api_and_client()

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
    except Exception as e:
        error_msg = str(e)
        raise HTTPException(
            status_code=400,
            detail=f"Kaggle API failed to list competitions: {error_msg}",
        )

    results = []
    if resp and resp.documents:
        for doc in resp.documents:
            # For competition documents, title and slug are directly on doc
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
    return await _list_kaggle_competition_notebooks(competition)


@router.post("/api/project/{project_id}/profile/import/kaggle")
async def import_kaggle_competition(
    project_id: uuid.UUID,
    payload: ImportKagglePayload,
    session: DatabaseSession,
):
    if payload.slugs:
        return await _pull_kaggle_notebooks(
            project_id, session, payload.slugs, payload.scores
        )

    if not payload.competition:
        raise HTTPException(status_code=400, detail="Missing competition or slugs")

    notebooks = await _list_kaggle_competition_notebooks(payload.competition)
    # limit to 10 for auto import to prevent long delays
    slugs = [nb["ref"] for nb in notebooks[:10]]

    return await _pull_kaggle_notebooks(project_id, session, slugs, payload.scores)
