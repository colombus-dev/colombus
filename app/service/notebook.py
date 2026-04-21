import os
from enum import Enum

import httpx

from fastapi import UploadFile, File

from app.models.api_model import Profile

ML_PROFILER_API_URL_PREFIX = os.environ["ML_PROFILER_API_URL_PREFIX"]
ML_PROFILER_API_TIMEOUT = 60


class TaxonomyFunction(str, Enum):
    DSPIPELINES = "dspipelines"
    DASWOW = "daswow"
    HEADERGEN = "headergen"


class ProfilerFunction(str, Enum):
    LLM = "llm"
    DSPIPELINES = "dspipelines"
    HEADERGEN = "headergen"


async def convert_to_profiles(
        notebook_files: list[UploadFile],
        taxonomy: TaxonomyFunction = TaxonomyFunction.DSPIPELINES,
        profiler: ProfilerFunction = ProfilerFunction.LLM
    ):
    if not notebook_files:
        return []
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f'{ML_PROFILER_API_URL_PREFIX}/v2/profile',
            files=[
                ("notebook_files", (nf.filename, await nf.read(), nf.content_type))
                for nf in notebook_files
            ],
            params={
                "profiler": profiler.value,
                "taxonomy": taxonomy.value
            },
            timeout=ML_PROFILER_API_TIMEOUT,
        )
        response.raise_for_status()
        profiles = response.json()
        return [Profile.model_validate(p) for p in profiles]
