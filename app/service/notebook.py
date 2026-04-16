from enum import Enum

import httpx

from fastapi import UploadFile, File

ML_PROFILER_API_URL_PREFIX = "http://localhost:8081"  # TODO ymu: move this to service envs
ML_PROFILER_API_TIMEOUT = 5


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
        multipart = [
            ("notebook_files", (nf.filename, await nf.read(), nf.content_type))
            for nf in notebook_files
        ]
        multipart += [
            ("profiler", profiler),
            ("taxonomy", taxonomy)
        ]
        response = await client.post(
            f'{ML_PROFILER_API_URL_PREFIX}/v2/profile',
            files=multipart,
            timeout=ML_PROFILER_API_TIMEOUT,
        )
        response.raise_for_status()
        return response
