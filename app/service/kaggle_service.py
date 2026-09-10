import logging
import re
import tempfile
import time
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


try:
    from kaggle.api.kaggle_api_extended import KaggleApi

    kaggle_import_error = None
except (Exception, SystemExit) as e:
    KaggleApi = None
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
        except (ValueError, OSError, RuntimeError) as e:
            traceback.print_exc()
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


from kagglesdk.search.types.search_api_service import (
    DocumentType,
    ListEntitiesFilters,
    ListEntitiesRequest,
)

_NOTEBOOK_SEARCH_CACHE: dict[str, tuple[float, dict[str, Any]]] = {}
NOTEBOOK_CACHE_TTL = 600


async def list_kaggle_competition_notebooks(
    competition: str, page_token: str | None = None
) -> dict[str, Any]:
    cache_key = f"{competition.strip().lower()}:{page_token or ''}"
    now = time.time()
    if cache_key in _NOTEBOOK_SEARCH_CACHE:
        ts, cached_results = _NOTEBOOK_SEARCH_CACHE[cache_key]
        if now - ts < NOTEBOOK_CACHE_TTL:
            return cached_results

    _, client = get_kaggle_api_and_client()

    req = ListEntitiesRequest()
    filters = ListEntitiesFilters()
    filters.query = competition
    filters.document_types = [DocumentType.KERNEL]
    req.filters = filters
    req.page_size = 100
    if page_token:
        req.page_token = page_token

    all_documents = []
    next_page_token = None
    try:
        client._http_client._init_session()
        client._http_client._session.timeout = 5.0
        resp = client.search.search_api_client.list_entities(req)
        if resp and resp.documents:
            all_documents.extend(resp.documents)
            next_page_token = getattr(resp, "next_page_token", None)
    except (ValueError, OSError, RuntimeError) as e:
        raise HTTPException(
            status_code=400,
            detail=f"Kaggle API failed to list kernels: {e}",
        )

    notebooks = []
    seen_refs = set()
    if all_documents:
        for doc in all_documents:
            author = doc.owner_user.user_name if doc.owner_user else None
            ref = f"{author}/{doc.slug}" if author else getattr(doc, "slug", "")
            title = getattr(doc, "title", getattr(doc, "slug", ""))
            best_score = (
                doc.kernel_document.best_public_score if doc.kernel_document else None
            )
            score_val = float(best_score) if best_score is not None else None

            if ref and ref not in seen_refs:
                seen_refs.add(ref)
                notebooks.append(
                    {
                        "ref": ref,
                        "title": title,
                        "author": author or "",
                        "score": score_val,
                    }
                )

    if not notebooks and not page_token:
        raise HTTPException(
            status_code=400, detail="No notebooks found for this competition."
        )

    result = {"notebooks": notebooks, "next_page_token": next_page_token}
    _NOTEBOOK_SEARCH_CACHE[cache_key] = (now, result)
    return result
