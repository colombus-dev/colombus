from datetime import datetime
from typing import Annotated, Any, Literal, Optional

from pydantic import BaseModel, Field, PlainSerializer, field_serializer

IdStr = Annotated[int, PlainSerializer(str, return_type=str, when_used="json")]

# Profile Graph


class CodeNode(BaseModel):
    id: int
    content: str


class MetaInstructionNode(BaseModel):
    id: int
    library: str | None
    function: str | None
    algorithm_family: str | None
    algorithm_name: str | None
    metric: str | None
    action: str | None
    codes: list[CodeNode]


class StepNode(BaseModel):
    name: str
    meta_instructions: list[MetaInstructionNode]


class ProfileNodes(BaseModel):
    id: IdStr
    name: str
    steps: list[StepNode]


# Profile JSON


class ProfileMetadata(BaseModel):
    version: str
    generation_date: datetime

    @field_serializer("generation_date", when_used="json")
    def serialize_generation_date_as_str(self, generation_date: datetime):
        return str(generation_date)


class Profile(BaseModel):
    name: str
    profile_metadata: ProfileMetadata = Field(
        alias="metadata"
    )  # use alias to avoid confusion with aql_model inherited metadata
    source: list[Any]
    outputs: dict[str, str]
    score: Optional[float] = Field(default=None)


# Pattern/PPM


class PpmResult(BaseModel):
    profile_id: IdStr
    profile_name: str
    results: list[list[str]]


class Pattern(BaseModel):
    name: str
    groups: list["PatternGroup"] | None = Field(default=None)


class PatternWithDSLApi(Pattern):
    dsl_content: str


class SavedPattern(PatternWithDSLApi):
    id: IdStr


class PatternMetaCharacters(BaseModel):
    startsWith: bool
    endsWith: bool
    negate: bool


class PatternMetaInstruction(BaseModel):
    algoFamily: Optional[str] = Field(default=None)
    algoName: Optional[str] = Field(default=None)
    library: Optional[str] = Field(default=None)
    function: Optional[str] = Field(default=None)


class PatternGroup(BaseModel):
    name: str
    steps: list[str]
    multiplicity: Literal["*", "+", "1"]
    metaInstructions: Optional[list[PatternMetaInstruction]] = Field(default=None)
    metaCharacters: PatternMetaCharacters
    subpattern: Optional["Pattern"] = Field(default=None)
