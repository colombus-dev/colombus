from enum import Enum
from typing import Any

import httpx

from app.models.api_model import Profile
from app.settings import get_settings

ML_PROFILER_API_TIMEOUT = 5 * 60
settings = get_settings()


class TaxonomyFunction(str, Enum):
    DSPIPELINES = "dspipelines"
    DASWOW = "daswow"
    HEADERGEN = "headergen"


class ProfilerFunction(str, Enum):
    LLM = "llm"
    DSPIPELINES = "dspipelines"
    HEADERGEN = "headergen"
    EMBEDDING = "embedding"


async def convert_to_profiles(
    notebook_files: list[Any],
    taxonomy: TaxonomyFunction = TaxonomyFunction.DSPIPELINES,
    profiler: ProfilerFunction = ProfilerFunction.EMBEDDING,
):
    if not notebook_files:
        return []
    async with httpx.AsyncClient(
        base_url=settings.ml_profiler_api_url_prefix
    ) as client:
        # TODO ymu: maybe create a shared client once at startup using fast API's lifespan for ex
        response = await client.post(
            "/v2/profile",
            files=[
                ("notebook_files", (nf.filename, await nf.read(), nf.content_type))
                for nf in notebook_files
            ],
            params={"profiler": profiler.value, "taxonomy": taxonomy.value},
            timeout=ML_PROFILER_API_TIMEOUT,
        )
        response.raise_for_status()
        profiles = response.json()
        return [Profile.model_validate(p) for p in profiles]
