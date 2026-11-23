import uuid
from typing import Any, Optional

from sqlalchemy import Index, text
from sqlalchemy.dialects import mysql, postgresql
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

from app.constants import QUERY_TIMEOUT_SECONDS
from app.settings import get_settings

settings = get_settings()

ProjectIdFk = Field(
    default=None, foreign_key="project.id", ondelete="CASCADE", index=True
)
ProfileIdFk = Field(
    default=None, foreign_key="profile.id", ondelete="CASCADE", index=True
)
LongString = String().with_variant(mysql.LONGTEXT(), "mysql", "mariadb")
JsonDict = JSON().with_variant(postgresql.JSONB(), "postgresql")


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
    __table_args__ = (Index("ix_step_profile_id_position", "profile_id", "position"),)

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(index=True)

    previous_step_id: uuid.UUID | None = Field(
        default=None, foreign_key="step.id", ondelete="CASCADE", index=True
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
    attributes: dict[str, Any] = Field(
        default_factory=dict, sa_column=Column(JsonDict, nullable=False)
    )
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


engine = create_engine(
    settings.database_url,
    echo=False,
    pool_pre_ping=True,
    connect_args={"options": f"-c statement_timeout={QUERY_TIMEOUT_SECONDS * 1000}"},
)


FLINK_STEP_WITH_PROJECT_VIEW = "flink_step_with_project"

# Attribute keys exposed as array columns by the flink step view.
# Bridge for the current flink table definition, to remove once flink reads attributes directly.
FLINK_VIEW_ATTRIBUTE_KEYS = ("algoFamily", "algoName", "library", "function")


def flink_view_sql() -> str:
    keys_array = ", ".join(f"'{key}'" for key in FLINK_VIEW_ATTRIBUTE_KEYS)
    key_columns = ",\n".join(
        "COALESCE(array_agg(DISTINCT mi_value.value) "
        f"FILTER (WHERE mi_value.key = '{key}'), ARRAY[]::text[]) AS {key.lower()}"
        for key in FLINK_VIEW_ATTRIBUTE_KEYS
    )
    return f"""
        CREATE VIEW {FLINK_STEP_WITH_PROJECT_VIEW} AS
        SELECT
            step.id::text AS step_id,
            step.profile_id::text AS profile_id,
            step.position,
            step.name,
            profile.project_id::text AS project_id,
            MAX(step.position) OVER (
                PARTITION BY step.profile_id::text, profile.project_id::text
            ) AS max_position,
            {key_columns}
        FROM step
        JOIN profile ON profile.id = step.profile_id
        LEFT JOIN metainstruction ON metainstruction.step_id = step.id
        LEFT JOIN LATERAL (
            SELECT wanted.key, element.value
            FROM unnest(ARRAY[{keys_array}]) AS wanted(key)
            CROSS JOIN LATERAL jsonb_array_elements_text(
                CASE jsonb_typeof(metainstruction.attributes -> wanted.key)
                    WHEN 'array' THEN metainstruction.attributes -> wanted.key
                    WHEN 'string' THEN jsonb_build_array(metainstruction.attributes -> wanted.key)
                    ELSE '[]'::jsonb
                END
            ) AS element(value)
        ) AS mi_value ON TRUE
        GROUP BY step.id, step.profile_id, step.position, step.name, profile.project_id
    """


def initialize():
    SQLModel.metadata.create_all(engine)
    with engine.begin() as connection:
        connection.execute(text(f"DROP VIEW IF EXISTS {FLINK_STEP_WITH_PROJECT_VIEW}"))
        connection.execute(text(flink_view_sql()))
