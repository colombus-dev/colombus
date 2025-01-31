import uuid

from pydantic import BaseModel
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
