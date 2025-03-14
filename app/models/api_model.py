import uuid

from typing import Literal, Optional

from pydantic import BaseModel, Field
from sqlmodel import SQLModel

from app.models.sql_model import ProfileBase, StepBase, MetaInstructionBase, CodeBase


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


class PpmResult(BaseModel):
    profile_name: str
    results: list[list[uuid.UUID]]


class Pattern(BaseModel):
    name: str
    groups: list["PatternGroup"] = Field(default=None)


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
