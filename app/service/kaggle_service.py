import logging
import re
import tempfile
import traceback
import uuid
from pathlib import Path
from typing import Any

from fastapi import HTTPException
from pydantic import BaseModel
from sqlmodel import Session

from app.service.notebook import convert_to_profiles
from app.settings import get_settings
from app.utils.save_notebook_sql import save_notebook_as_sql

logger = logging.getLogger(__name__)

from kagglesdk.search.types.search_api_service import (
    DocumentType,
    ListEntitiesFilters,
    ListEntitiesRequest,
)

try:
    from kaggle.api.kaggle_api_extended import KaggleApi
    from kaggle.rest import ApiException as KaggleApiException

    kaggle_import_error = None
except (Exception, SystemExit) as e:
    KaggleApi = None
    KaggleApiException = Exception
    kaggle_import_error = str(e)


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


def get_kaggle_api_and_client():
    if not is_kaggle_available():
        raise HTTPException(
            status_code=400,
            detail=f"Kaggle is not configured. Please set KAGGLE_USERNAME and KAGGLE_KEY in your .env file. Import error (if any): {kaggle_import_error}",
        )
    api = KaggleApi()
    api.authenticate()
    client = api.build_kaggle_client()
    return api, client


def is_kaggle_available() -> bool:
    settings = get_settings()
    return KaggleApi is not None and settings.is_kaggle_token_set


def download_kaggle_notebooks(
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
        except (KaggleApiException, ValueError, OSError) as e:
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


async def pull_kaggle_notebooks(
    project_id: uuid.UUID,
    session: Session,
    slugs: list[str],
    scores: dict[str, float] | None = None,
) -> list[str]:
    api, _ = get_kaggle_api_and_client()

    with tempfile.TemporaryDirectory() as tmp_dir:
        mock_files = download_kaggle_notebooks(api, slugs, tmp_dir)

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


async def get_kaggle_scores(competition: str) -> dict[str, float]:
    try:
        _, client = get_kaggle_api_and_client()
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
    except (ValueError, OSError, RuntimeError) as e:
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


async def list_kaggle_competition_notebooks(competition: str) -> list[dict[str, Any]]:
    _, client = get_kaggle_api_and_client()

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
    except (ValueError, OSError, RuntimeError) as e:
        error_msg = str(e)
        raise HTTPException(
            status_code=400,
            detail=f"Kaggle API failed to list kernels: {error_msg}",
        )

    try:
        scores = await get_kaggle_scores(competition)
    except (ValueError, OSError, RuntimeError) as e:
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
