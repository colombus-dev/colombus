import os
import uuid

from typing import Any, List

from sqlmodel import SQLModel, Field, Relationship, create_engine, JSON, String, Column
from sqlalchemy.dialects import mysql
from sqlalchemy.orm import relationship


ProfileIdFk = Field(default=None, foreign_key="profile.id", ondelete="CASCADE")
LongString = String().with_variant(mysql.LONGTEXT(), "mysql", "mariadb")


class ProfileBase(SQLModel):
    name: str


class Profile(ProfileBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    json_profile: dict[str, Any] = Field(sa_type=JSON)

    steps: list["Step"] = Relationship(
        back_populates="profile",
        sa_relationship=relationship(order_by="asc(Step.position)"),
    )
    meta_instructions: list["MetaInstruction"] = Relationship(
        back_populates="profile",
        sa_relationship=relationship(order_by="asc(MetaInstruction.position)"),
    )
    codes: list["Code"] = Relationship(
        back_populates="profile",
        sa_relationship=relationship(order_by="asc(Code.position)"),
    )


class StepBase(SQLModel):
    name: str
    position: int
    # number of children is cached and used to compute graph nodes size
    number_children: int


class Step(StepBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)

    profile_id: uuid.UUID | None = ProfileIdFk
    profile: Profile = Relationship(back_populates="steps")

    meta_instructions: list["MetaInstruction"] = Relationship(back_populates="step")


class MetaInstructionBase(SQLModel):
    algoFamily: str | None = None
    algoName: str | None = None
    library: str | None = None
    function: str | None = None
    position: int
    # number of children is cached and used to compute graph nodes size
    number_children: int


class MetaInstruction(MetaInstructionBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)

    profile_id: uuid.UUID | None = ProfileIdFk
    profile: Profile = Relationship(back_populates="meta_instructions")

    step_id: uuid.UUID | None = Field(
        default=None, foreign_key="step.id", ondelete="CASCADE"
    )
    step: Step = Relationship(back_populates="meta_instructions")

    codes: list["Code"] = Relationship(back_populates="meta_instruction")


class CodeBase(SQLModel):
    content: str = Field(sa_column=Column(LongString))
    position: int


class Code(CodeBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)

    profile_id: uuid.UUID | None = ProfileIdFk
    profile: Profile = Relationship(back_populates="codes")

    meta_instruction_id: uuid.UUID | None = Field(
        default=None, foreign_key="metainstruction.id", ondelete="CASCADE"
    )
    meta_instruction: MetaInstruction = Relationship(back_populates="codes")


class Pattern(SQLModel, table=True):

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str
    json_pattern: dict[str, Any] = Field(sa_type=JSON)

    elements: list["PatternElement"] = Relationship(back_populates="pattern")


class PatternElement(SQLModel, table=True):

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str
    position: int

    pattern_id: uuid.UUID | None = Field(
        default=None, foreign_key="pattern.id", ondelete="CASCADE"
    )
    pattern: Pattern = Relationship(back_populates="elements")


engine = create_engine(os.getenv("MYSQL_FULL_URL"), echo=False)


def create_db_and_tables():
    SQLModel.metadata.create_all(engine)
