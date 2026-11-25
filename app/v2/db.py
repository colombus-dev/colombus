import collections.abc
import contextlib
import typing

import sqlalchemy
import sqlalchemy.orm

from . import models

CHUNK_SIZE = 5000


def create_database(url: str | sqlalchemy.URL) -> None:
    parsed = sqlalchemy.make_url(url)
    if parsed.get_backend_name() != "postgresql":
        raise NotImplementedError("PostgreSQL is the only backend supported")
    engine = sqlalchemy.create_engine(
        parsed.set(database="postgres"), isolation_level="AUTOCOMMIT"
    )
    with engine.connect() as connection:
        exists = connection.execute(
            sqlalchemy.text("SELECT 1 FROM pg_database WHERE datname = :name"),
            {"name": parsed.database},
        ).first()
        if exists is None:
            connection.execute(sqlalchemy.text(f'CREATE DATABASE "{parsed.database}"'))
    engine.dispose()


def reset_tables(session: sqlalchemy.orm.Session) -> None:
    connection = session.connection()
    models.Base.metadata.drop_all(connection)
    models.Base.metadata.create_all(connection)


@contextlib.contextmanager
def session_scope(
    engine: sqlalchemy.Engine,
) -> collections.abc.Iterator[sqlalchemy.orm.Session]:
    with sqlalchemy.orm.Session(engine) as session:
        with session.begin():
            yield session


def add(session: sqlalchemy.orm.Session, instance: typing.Any) -> typing.Any:
    session.add(instance)
    session.flush()
    return instance


def bulk_insert(
    session: sqlalchemy.orm.Session,
    model: type[models.Base],
    rows: collections.abc.Sequence[collections.abc.Mapping[str, typing.Any]],
) -> list[int]:
    ids: list[int] = []
    for start in range(0, len(rows), CHUNK_SIZE):
        result = session.execute(
            sqlalchemy.insert(model).returning(
                model.__table__.c.id, sort_by_parameter_order=True
            ),
            rows[start : start + CHUNK_SIZE],
        )
        ids.extend(result.scalars())
    return ids
