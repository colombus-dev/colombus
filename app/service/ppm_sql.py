import uuid

from sqlmodel import Session, text

from app.models.api_model import PatternGroup, PpmResult
from app.utils.convert_ppm_to_sql import convert_ppm_to_sql_query


def run_ppm_sql(
    project_id: uuid.UUID, pattern: list[PatternGroup], session: Session
) -> list[PpmResult]:
    query = convert_ppm_to_sql_query(project_id, pattern)
    # TODO: improve this uuid conversion
    return [
        PpmResult(
            profile_name=r[0],
            results=[[e for e in f if e is not None] for f in r[1:] if f is not None],
        )
        for r in session.execute(text(query)).all()
    ]


def run_saved_ppm_sql(
    project_id: uuid.UUID, pattern: list[PatternGroup], session: Session
) -> list[PpmResult]:
    query = convert_ppm_to_sql_query(project_id, pattern)
    # TODO: improve this uuid conversion
    return [
        PpmResult(
            profile_name=r[0],
            results=[
                [
                    (uuid.UUID(e) if isinstance(e, str) else e)
                    for e in (f.split(",") if isinstance(f, str) else [f])
                ]
                for f in r[1:]
                if f is not None
            ],
        )
        for r in session.execute(text(query)).all()
    ]
