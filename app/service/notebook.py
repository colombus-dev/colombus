import logging
from enum import Enum
from typing import Any, Generator

import httpx
import ujson
from pydantic import BaseModel

from app.models.api_model import Profile
from app.models.parser import ParserFunction, ParserSubgraph
from app.parsers.factory import get_parser
from app.settings import get_settings

ML_PROFILER_API_TIMEOUT = 5 * 60
settings = get_settings()


class NotebookInformation(BaseModel):
    "Groups all needed information for profiling in one object"

    name: str
    parser_model: list[ParserSubgraph]
    source_code: str
    parser_function: str


class TaxonomyFunction(str, Enum):
    DSPIPELINES = "dspipelines"
    DASWOW = "daswow"
    HEADERGEN = "headergen"


class ProfilerFunction(str, Enum):
    LLM = "llm"
    DSPIPELINES = "dspipelines"
    HEADERGEN = "headergen"
    EMBEDDING = "embedding"


class NotebookCellIterator:
    "Class for iterating on a notebook file"

    def __init__(self, content_raw: str):
        self._content_parsed = ujson.loads(content_raw)
        self._generator = self._iterate_cells()

    def __iter__(self):
        self._generator = self._iterate_cells()
        return self

    def __next__(self) -> dict:
        return next(self._generator)

    def _iterate_cells(self) -> Generator[dict, Any, None]:
        # yield only cells with source code, also transform source code to str
        for cell in self._content_parsed["cells"]:
            if cell["cell_type"] == "code":
                if isinstance(cell["source"], list):
                    cell["source"] = "".join(cell["source"])
                if cell["source"]:
                    yield cell


async def get_notebooks_information(list_of_notebooks, parser_name):
    "Parses notebooks given a parser and put all needed information for profiling in a single object"

    list_of_notebook_information = []

    for notebook in list_of_notebooks:
        file_content = await notebook.read()
        source_code = "\n".join(
            c["source"] for c in NotebookCellIterator(file_content.decode("utf8"))
        )

        parser_model = get_parser(parser_name).parse_code(source_code)

        notebook_information = NotebookInformation(
            name=notebook.filename,
            parser_model=parser_model,
            source_code=source_code,
            parser_function=parser_name.value,
        )

        list_of_notebook_information.append(notebook_information)

    return list_of_notebook_information


async def convert_to_profiles(
    list_of_notebooks: list[Any],
    taxonomy: TaxonomyFunction = TaxonomyFunction.DSPIPELINES,
    profiler: ProfilerFunction = ProfilerFunction.EMBEDDING,
    parser_name: ParserFunction = ParserFunction.VESPUCCI,
):
    """
    Parse notebooks and returns their profiles according to a taxonomy, a profiler and a parsing function
    """

    if not list_of_notebooks:
        return []
    async with httpx.AsyncClient(
        base_url=settings.ml_profiler_api_url_prefix
    ) as client:
        # TODO ymu: maybe create a shared client once at startup using fast API's lifespan for ex

        list_of_notebook_information = get_notebooks_information(
            list_of_notebooks, parser_name
        )

        response = await client.post(
            "/v2/profile",
            params={
                "profiler": profiler.value,
                "taxonomy": taxonomy.value,
            },
            json={
                "data": [
                    notebook.model_dump() for notebook in list_of_notebook_information
                ]
            },
            timeout=ML_PROFILER_API_TIMEOUT,
        )

        response.raise_for_status()
        profiles = response.json()
        return [Profile.model_validate(p) for p in profiles]
