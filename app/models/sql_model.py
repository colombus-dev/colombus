import os
import uuid
from typing import Any, Optional

from sqlalchemy.dialects import mysql
from sqlalchemy.orm import relationship
from sqlmodel import (
    JSON,
    Column,
    Field,
    Relationship,
    SQLModel,
    String,
    create_engine,
)

ProjectIdFk = Field(default=None, foreign_key="project.id", ondelete="CASCADE")
ProfileIdFk = Field(
    default=None, foreign_key="profile.id", ondelete="CASCADE", index=True
)
LongString = String().with_variant(mysql.LONGTEXT(), "mysql", "mariadb")


# "app management"-related tables


class Project(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str

    profiles: list["Profile"] = Relationship(
        back_populates="project",
        sa_relationship=relationship(order_by="asc(Profile.name)"),
    )
    patterns: list["Pattern"] = Relationship(
        back_populates="project",
        sa_relationship=relationship(order_by="asc(Pattern.name)"),
    )


# Profile-related tables


class ProfileBase(SQLModel):
    name: str


class Profile(ProfileBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    project_id: uuid.UUID = ProjectIdFk
    json_profile: dict[str, Any] = Field(sa_type=JSON)
    encoded_profile: str

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
    project: Project = Relationship(back_populates="profiles")


class StepBase(SQLModel):
    name: str
    position: int
    # number of children is cached and used to compute graph nodes size
    number_children: int


class Step(StepBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(index=True)

    previous_step_id: uuid.UUID | None = Field(
        default=None, foreign_key="step.id", ondelete="CASCADE"
    )
    previous_step: Optional["Step"] = Relationship(
        back_populates="next_step",
        sa_relationship_kwargs={"remote_side": "Step.id", "uselist": False},
    )

    next_step: Optional["Step"] = Relationship(back_populates="previous_step")

    profile_id: uuid.UUID | None = ProfileIdFk
    profile: Profile = Relationship(back_populates="steps")

    meta_instructions: list["MetaInstruction"] = Relationship(back_populates="step")

    cell_outputs: list["CellOutput"] = Relationship(back_populates="step")


class CellOutput(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    image: str

    step_id: uuid.UUID | None = Field(
        default=None, foreign_key="step.id", ondelete="CASCADE", index=True
    )
    step: Step = Relationship(back_populates="cell_outputs")


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
        default=None, foreign_key="step.id", ondelete="CASCADE", index=True
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
        default=None,
        foreign_key="metainstruction.id",
        ondelete="CASCADE",
        index=True,
    )
    meta_instruction: MetaInstruction = Relationship(back_populates="codes")


# PPM-related tables


class Pattern(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    project_id: uuid.UUID = ProjectIdFk
    name: str
    json_pattern: dict[str, Any] = Field(sa_type=JSON)
    dsl_content: str

    project: Project = Relationship(back_populates="patterns")


engine = create_engine(os.environ["POSTGRESQL_FULL_URL"], echo=False)


def create_db_and_tables():
    SQLModel.metadata.create_all(engine)
