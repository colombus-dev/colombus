import uuid
from datetime import datetime
from typing import Any, Literal, Optional

from pydantic import BaseModel, Field, field_serializer

from app.models.sql_model import (
    CodeBase,
    MetaInstructionBase,
    ProfileBase,
    StepBase,
)


# Profile Graph


class StepNode(StepBase):
    id: uuid.UUID


class MetaInstructionNode(MetaInstructionBase):
    id: uuid.UUID
    step_id: uuid.UUID


class CodeNode(CodeBase):
    id: uuid.UUID
    meta_instruction_id: uuid.UUID


class ProfileNodes(ProfileBase):
    id: uuid.UUID
    name: str
    steps: list[StepNode]
    meta_instructions: list[MetaInstructionNode]
    codes: list[CodeNode]


# Profile JSON


class ProfileMetadata(BaseModel):
    version: str
    generation_date: datetime

    @field_serializer("generation_date", when_used="json")
    def serialize_generation_date_as_str(self, generation_date: datetime):
        return str(generation_date)


class Profile(ProfileBase):
    name: str
    profile_metadata: ProfileMetadata = Field(alias="metadata") # use alias to avoid confusion with aql_model inherited metadata
    source: list[Any]
    outputs: dict[str, str]


# Pattern/PPM


class PpmResult(BaseModel):
    profile_name: str
    results: list[list[uuid.UUID]]


class Pattern(BaseModel):
    name: str
    groups: list["PatternGroup"] | None = Field(default=None)


class PatternWithDSLApi(Pattern):
    dsl_content: str


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


class RegexCompatibleProfileElement(BaseModel):
    step: str
    algoFamily: str
    algoName: str
    library: str
    function: str


# Diff


class DiffResult(PpmResult):
    ratio: float
