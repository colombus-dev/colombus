import typing

import sqlalchemy
import sqlalchemy.orm

BigInt = sqlalchemy.BigInteger().with_variant(sqlalchemy.Integer(), "sqlite")
Pk = sqlalchemy.orm.Mapped[
    typing.Annotated[
        int,
        sqlalchemy.orm.mapped_column(BigInt, sqlalchemy.Identity(), primary_key=True),
    ]
]
Fk = sqlalchemy.orm.Mapped[int]
Str = sqlalchemy.orm.Mapped[str]
OptionalStr = sqlalchemy.orm.Mapped[str | None]


def primary_key():
    return sqlalchemy.orm.mapped_column(init=False)


def foreign_key(target: str):
    return sqlalchemy.orm.mapped_column(
        BigInt, sqlalchemy.ForeignKey(target, ondelete="CASCADE")
    )


def indexed(**kwargs: typing.Any):
    return sqlalchemy.orm.mapped_column(index=True, **kwargs)


def children(order_by: str):
    return sqlalchemy.orm.relationship(
        default_factory=list, passive_deletes=True, order_by=order_by, init=False
    )


class Base(
    sqlalchemy.orm.MappedAsDataclass, sqlalchemy.orm.DeclarativeBase, kw_only=True
):
    pass


class Project(Base, kw_only=True):
    __tablename__ = "project"

    id: Pk = primary_key()
    name: Str = sqlalchemy.orm.mapped_column(unique=True)

    profiles: sqlalchemy.orm.Mapped[list["Profile"]] = children("Profile.id")


class Profile(Base, kw_only=True):
    __tablename__ = "profile"
    __table_args__ = (sqlalchemy.UniqueConstraint("project_id", "name"),)

    id: Pk = primary_key()
    project_id: Fk = foreign_key("project.id")
    name: Str

    meta_instructions: sqlalchemy.orm.Mapped[list["MetaInstruction"]] = children(
        "MetaInstruction.id"
    )


class MetaInstruction(Base, kw_only=True):
    __tablename__ = "meta_instruction"
    __table_args__ = (
        sqlalchemy.Index("ix_meta_instruction_scan", "project_id", "profile_id", "id"),
    )

    id: Pk = primary_key()
    project_id: Fk = foreign_key("project.id")
    profile_id: Fk = foreign_key("profile.id")
    step: Str = indexed()
    library: OptionalStr = indexed(default=None)
    function: OptionalStr = indexed(default=None)
    algorithm_family: OptionalStr = indexed(default=None)
    algorithm_name: OptionalStr = indexed(default=None)
    metric: OptionalStr = indexed(default=None)
    action: OptionalStr = indexed(default=None)

    codes: sqlalchemy.orm.Mapped[list["Code"]] = children("Code.id")


class Code(Base, kw_only=True):
    __tablename__ = "code"
    __table_args__ = (
        sqlalchemy.Index("ix_code_meta_instruction", "meta_instruction_id"),
    )

    id: Pk = primary_key()
    meta_instruction_id: Fk = foreign_key("meta_instruction.id")
    content: Str = sqlalchemy.orm.mapped_column(sqlalchemy.Text)
