import typing

import sqlalchemy
import sqlalchemy.orm

from app.constants import QUERY_TIMEOUT_SECONDS
from app.settings import get_settings

settings = get_settings()

Pk = sqlalchemy.orm.Mapped[
    typing.Annotated[
        int,
        sqlalchemy.orm.mapped_column(
            sqlalchemy.BigInteger, sqlalchemy.Identity(), primary_key=True
        ),
    ]
]
Fk = sqlalchemy.orm.Mapped[int]
Str = sqlalchemy.orm.Mapped[str]
OptionalStr = sqlalchemy.orm.Mapped[str | None]


def primary_key():
    return sqlalchemy.orm.mapped_column(init=False)


def foreign_key(target: str, index: bool = False, init: bool = True):
    return sqlalchemy.orm.mapped_column(
        sqlalchemy.BigInteger,
        sqlalchemy.ForeignKey(target, ondelete="CASCADE"),
        index=index,
        init=init,
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
    @staticmethod
    def group_by[T](
        items: typing.Iterable[T], column: str
    ) -> dict[typing.Any, list[T]]:
        groups: dict[typing.Any, list[T]] = {}
        for item in items:
            groups.setdefault(getattr(item, column), []).append(item)
        return groups


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
    score: sqlalchemy.orm.Mapped[float | None] = sqlalchemy.orm.mapped_column(
        default=None
    )

    meta_instructions: sqlalchemy.orm.Mapped[list["MetaInstruction"]] = children(
        "MetaInstruction.id"
    )


class MetaInstruction(Base, kw_only=True):
    __tablename__ = "meta_instruction"
    __table_args__ = (
        sqlalchemy.Index("ix_meta_instruction_scan", "project_id", "profile_id", "id"),
        sqlalchemy.Index("ix_meta_instruction_project_step", "project_id", "step"),
    )

    id: Pk = primary_key()
    project_id: Fk = foreign_key("project.id")
    profile_id: Fk = foreign_key("profile.id", init=False)
    step: Str
    library: OptionalStr = indexed(default=None)
    function: OptionalStr = indexed(default=None)
    algorithm_family: OptionalStr = indexed(default=None)
    algorithm_name: OptionalStr = indexed(default=None)
    metric: OptionalStr = indexed(default=None)
    action: OptionalStr = indexed(default=None)

    codes: sqlalchemy.orm.Mapped[list["Code"]] = children("Code.id")

    @staticmethod
    def get_step_starts(
        session: sqlalchemy.orm.Session,
        project_id: int,
        profile_ids: list[int] | None = None,
    ) -> typing.Sequence[sqlalchemy.Row]:
        profile_filter = (
            "" if profile_ids is None else "AND profile_id = ANY(:profile_ids)"
        )
        query = f"""
            SELECT profile_id, id, step AS name
            FROM (
                SELECT id, profile_id, step,
                       LAG(step) OVER (PARTITION BY profile_id ORDER BY id) AS previous_step
                FROM meta_instruction
                WHERE project_id = :project_id {profile_filter}
            ) AS instructions
            WHERE previous_step IS DISTINCT FROM step
            ORDER BY profile_id, id
        """
        parameters: dict[str, typing.Any] = {"project_id": project_id}
        if profile_ids is not None:
            parameters["profile_ids"] = profile_ids
        return session.execute(sqlalchemy.text(query), parameters).all()


class Code(Base, kw_only=True):
    __tablename__ = "code"

    id: Pk = primary_key()
    meta_instruction_id: Fk = foreign_key("meta_instruction.id", index=True, init=False)
    content: Str = sqlalchemy.orm.mapped_column(sqlalchemy.Text)


class Pattern(Base, kw_only=True):
    __tablename__ = "pattern"

    id: Pk = primary_key()
    project_id: Fk = foreign_key("project.id", index=True)
    name: Str
    json_pattern: sqlalchemy.orm.Mapped[dict[str, typing.Any]] = (
        sqlalchemy.orm.mapped_column(sqlalchemy.JSON)
    )
    dsl_content: Str


engine = sqlalchemy.create_engine(
    settings.database_url,
    echo=False,
    pool_pre_ping=True,
    connect_args={"options": f"-c statement_timeout={QUERY_TIMEOUT_SECONDS * 1000}"},
)


def initialize():
    Base.metadata.create_all(engine)
