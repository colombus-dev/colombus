import uuid
from typing import Sequence

from fastapi import APIRouter
from sqlmodel import select, text

from app.dependencies import DatabaseSession
from app.exceptions import ElementNotFoundException
from app.models.api_model import Pattern as PatternApi
from app.models.api_model import PatternGroup, PpmResult
from app.models.sql_model import Pattern
from app.utils.convert_ppm_to_sql import convert_ppm_to_sql_query


router = APIRouter()


@router.get("/api/project/{project_id}/ppm/getAll")
async def get_all_ppm(
    project_id: str,
    session: DatabaseSession,
) -> Sequence[PatternApi]:
    return session.exec(
        select(Pattern.json_pattern)
        .where(Pattern.project_id == project_id)
        .order_by(Pattern.name)
    ).all()


@router.post("/api/project/{project_id}/ppm/execute")
async def execute_ppm(
    project_id: uuid.UUID,
    pattern: list[PatternGroup],
    session: DatabaseSession,
) -> list[PpmResult]:
    query = convert_ppm_to_sql_query(project_id, pattern)
    # TODO: improve this uuid conversion
    return [
        PpmResult(
            profile_name=r[0],
            results=[[e for e in f if e is not None] for f in r[1:] if f is not None],
        )
        for r in session.exec(text(query)).all()
    ]


@router.post("/api/project/{project_id}/ppm/execute/{name}")
async def execute_ppm_with_name(
    project_id: uuid.UUID, name: str, session: DatabaseSession
) -> list[PpmResult]:
    ppm = session.execute(
        select(Pattern.json_pattern).where(
            (Pattern.project_id == project_id) & (Pattern.name == name)
        )
    ).scalar_one()
    query = convert_ppm_to_sql_query(project_id, PatternGroup(**ppm))
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
        for r in session.exec(text(query)).all()
    ]


@router.post("/api/project/{project_id}/ppm/save/{name}")
async def save_ppm(
    project_id: uuid.UUID,
    name: str,
    pattern: PatternApi,
    session: DatabaseSession,
) -> str:
    retrieved_session_pattern = session.exec(
        select(Pattern).where(Pattern.project_id == project_id, Pattern.name == name)
    ).one_or_none()
    session_pattern = retrieved_session_pattern or Pattern(
        project_id=project_id, name=name, json_pattern={}
    )
    session_pattern.json_pattern = pattern.model_dump()
    session.add(session_pattern)
    session.commit()
    return session_pattern.name


# TODO: change name to pattern_id in delete operation
@router.delete("/api/project/{project_id}/ppm/delete/{name}")
async def delete_ppm(project_id: uuid.UUID, name: str, session: DatabaseSession):
    pattern = session.exec(
        select(Pattern).where(Pattern.project_id == project_id, Pattern.name == name)
    ).one_or_none()
    if not pattern:
        raise ElementNotFoundException("pattern")
    session.delete(pattern)
    session.commit()
