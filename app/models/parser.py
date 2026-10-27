from enum import Enum

from pydantic import BaseModel, TypeAdapter


class ParserFunction(str, Enum):
    "Available parsing function"

    DSPIPELINES = "dspipelines"
    VESPUCCI = "vespucci"


class ParserSubgraphLine(BaseModel):
    start: int
    end: int


class ParserSubgraphCursor(BaseModel):
    start: int
    end: int


class ParserSubgraph(BaseModel):
    "Model of subgraph element return by a parser"

    id: str
    library: str
    function: str
    source: str
    step_name: str
    line: ParserSubgraphLine
    cursor: ParserSubgraphCursor


ParserSubgraphList: TypeAdapter = TypeAdapter(list[ParserSubgraph])
