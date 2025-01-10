import os

from typing import Any

from sqlalchemy import create_engine, ForeignKey
from sqlalchemy.orm import (
    DeclarativeBase,
    Mapped,
    mapped_column,
    relationship,
)
from sqlalchemy.dialects import mysql
from sqlalchemy.types import String, JSON


# TODO: consider using https://sqlmodel.tiangolo.com/#write-to-the-database for pydantic compatibility

StandardString = String(80).with_variant(mysql.VARCHAR(80), "mysql", "mariadb")
Uuid4String = String(36).with_variant(mysql.VARCHAR(36), "mysql", "mariadb")
LongString = String().with_variant(mysql.LONGTEXT(), "mysql", "mariadb")


class Base(DeclarativeBase): ...


class Code(Base):
    __tablename__ = "code"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    content: Mapped[str] = mapped_column(LongString)
    # position: Mapped[int]

    meta_instruction_id: Mapped[int] = mapped_column(ForeignKey("meta_instruction.id"))
    meta_instruction: Mapped["MetaInstruction"] = relationship(
        back_populates="code",
        cascade="delete, delete-orphan, merge, save-update",
        single_parent=True,
    )

    cross_db_uuid: Mapped[str] = mapped_column(Uuid4String)

    def __repr__(self) -> str:
        return f"Code(id={self.id!r}, content={self.content!r})"


class MetaInstruction(Base):
    __tablename__ = "meta_instruction"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    algoFamily: Mapped[str] = mapped_column(StandardString, index=True)
    algoName: Mapped[str] = mapped_column(StandardString, index=True)
    library: Mapped[str] = mapped_column(StandardString, index=True)
    function: Mapped[str] = mapped_column(StandardString, index=True)
    # position: Mapped[int]

    code: Mapped["Code"] = relationship(
        back_populates="meta_instruction",
        cascade="delete, delete-orphan, merge, save-update",
    )

    step_id: Mapped[int] = mapped_column(ForeignKey("step.id"))
    step: Mapped["Step"] = relationship(
        back_populates="metaInstructions",
        cascade="delete, delete-orphan, merge, save-update",
        single_parent=True,
    )

    cross_db_uuid: Mapped[str] = mapped_column(Uuid4String)

    def __repr__(self) -> str:
        return f"Step(id={self.id!r}, algoFamily={self.algoFamily!r}, algoName={self.algoName!r}, library={self.library!r}, function={self.function!r})"


class Step(Base):
    __tablename__ = "step"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(StandardString, index=True)
    position: Mapped[int]

    metaInstructions: Mapped[list["MetaInstruction"]] = relationship(
        back_populates="step", cascade="all, delete, delete-orphan, merge, save-update"
    )

    stage_id: Mapped[int] = mapped_column(ForeignKey("stage.id"))
    stage: Mapped["Stage"] = relationship(
        back_populates="steps",
        cascade="delete, delete-orphan, merge, save-update",
        single_parent=True,
    )

    cross_db_uuid: Mapped[str] = mapped_column(Uuid4String)

    def __repr__(self) -> str:
        return f"Step(id={self.id!r}, name={self.name!r}, position={self.position!r})"


class Stage(Base):
    __tablename__ = "stage"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(StandardString, index=True)
    position: Mapped[int]

    steps: Mapped[list["Step"]] = relationship(
        back_populates="stage", cascade="all, delete, delete-orphan, merge, save-update"
    )

    profile_id: Mapped[int] = mapped_column(ForeignKey("profile.id"))
    profile: Mapped["Profile"] = relationship(
        back_populates="stages",
        cascade="delete, delete-orphan, merge, save-update",
        single_parent=True,
    )

    cross_db_uuid: Mapped[str] = mapped_column(Uuid4String)

    def __repr__(self) -> str:
        return f"Stage(id={self.id!r}, name={self.name!r}, position={self.position!r})"


class Profile(Base):
    __tablename__ = "profile"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(StandardString, index=True, unique=True)
    json_profile: Mapped[dict[str, Any]] = mapped_column(type_=JSON)

    stages: Mapped[list["Stage"]] = relationship(
        back_populates="profile",
        cascade="all, delete, delete-orphan, merge, save-update",
    )

    def __repr__(self) -> str:
        return f"Profile(id={self.id!r}, name={self.name!r})"


engine = create_engine(
    os.getenv("MYSQL_FULL_URL"),
    echo=False,
)

Base.metadata.create_all(engine)
