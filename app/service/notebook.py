import os
from enum import Enum
from typing import Any

import httpx

from app.models.api_model import Profile

ML_PROFILER_API_URL_PREFIX = os.environ["ML_PROFILER_API_URL_PREFIX"]
ML_PROFILER_API_TIMEOUT = 5 * 60


class TaxonomyFunction(str, Enum):
    DSPIPELINES = "dspipelines"
    DASWOW = "daswow"
    HEADERGEN = "headergen"


class ProfilerFunction(str, Enum):
    LLM = "llm"
    DSPIPELINES = "dspipelines"
    HEADERGEN = "headergen"


async def convert_to_profiles(
    notebook_files: list[Any],
    taxonomy: TaxonomyFunction = TaxonomyFunction.DSPIPELINES,
    profiler: ProfilerFunction = ProfilerFunction.LLM,
):
    if not notebook_files:
        return []
    async with httpx.AsyncClient(base_url=ML_PROFILER_API_URL_PREFIX) as client:
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
