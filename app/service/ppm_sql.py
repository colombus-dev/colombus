import uuid

from sqlmodel import Session, select, text

from app.models.api_model import PatternGroup, PpmResult
from app.models.sql_model import Profile
from app.utils.convert_ppm_to_sql import convert_ppm_to_sql_query


def _profile_ids_by_name(session: Session, project_id: uuid.UUID) -> dict:
    return dict(
        session.exec(
            select(Profile.name, Profile.id).where(Profile.project_id == project_id)
        ).all()
    )


def run_ppm_sql(
    project_id: uuid.UUID, pattern: list[PatternGroup], session: Session
) -> list[PpmResult]:
    query = convert_ppm_to_sql_query(project_id, pattern)
    profile_ids = _profile_ids_by_name(session, project_id)
    # TODO: improve this uuid conversion
    return [
        PpmResult(
            profile_id=profile_ids[r[0]],
            profile_name=r[0],
            results=[[e for e in f if e is not None] for f in r[1:] if f is not None],
        )
        for r in session.execute(text(query)).all()
    ]


def run_saved_ppm_sql(
    project_id: uuid.UUID, pattern: list[PatternGroup], session: Session
) -> list[PpmResult]:
    query = convert_ppm_to_sql_query(project_id, pattern)
    profile_ids = _profile_ids_by_name(session, project_id)
    # TODO: improve this uuid conversion
    return [
        PpmResult(
            profile_id=profile_ids[r[0]],
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
