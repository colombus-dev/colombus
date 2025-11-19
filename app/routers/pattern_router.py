import uuid

import canopus_dsl
from fastapi import APIRouter
from pydantic import BaseModel
from sqlmodel import col, select, text

from app.dependencies import DatabaseSession
from app.exceptions import ElementNotFoundException, InvalidPatternDefinitionException
from app.models.api_model import Pattern as PatternApi, PatternWithDSLApi
from app.models.api_model import PatternGroup, PpmResult
from app.models.sql_model import Pattern
from app.utils.convert_canopus_to_legacy import convert_pattern_to_legacy
from app.utils.convert_ppm_to_sql import convert_ppm_to_sql_query


router = APIRouter()

# TODO: support multiple (sub)-patterns


@router.get("/api/project/{project_id}/ppm/getAll")
async def get_all_ppm(
    project_id: str,
    session: DatabaseSession,
) -> list[PatternWithDSLApi]:
    retrieved_patterns = session.exec(
        select(Pattern.json_pattern, Pattern.dsl_content)
        .where(Pattern.project_id == project_id)
        .order_by(Pattern.name)
    ).all()
    return [
        PatternWithDSLApi(dsl_content=p[1] or "", **p[0]) for p in retrieved_patterns
    ]


class ParsePpmParams(BaseModel):
    pattern_dsl: str


class ExecutePpmResponse(BaseModel):
    pattern: PatternApi
    results: list[PpmResult]


@router.post("/api/project/{project_id}/ppm/parse")
async def parse_ppm(
    project_id: uuid.UUID,
    params: ParsePpmParams,
    session: DatabaseSession,
) -> PatternApi:
    canopus_listener = canopus_dsl.parse_string(params.pattern_dsl)
    if not canopus_listener.program:
        raise InvalidPatternDefinitionException()
    all_patterns_names = [p.name for p in canopus_listener.program.patterns]
    all_imports_to_load = [
        imp for imp in canopus_listener.program.imports if imp not in all_patterns_names
    ]
    imported_patterns = [
        PatternApi(**imp_p)
        for imp_p in session.exec(
            select(Pattern.json_pattern).where(
                col(Pattern.name).in_(all_imports_to_load)
            )
        ).all()
    ]
    # TODO: manage imports
    return convert_pattern_to_legacy(
        canopus_listener.program.patterns[:-1],
        canopus_listener.program.patterns[-1],
        imported_patterns,
    )


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
    ppm = session.exec(
        select(Pattern.json_pattern).where(
            (Pattern.project_id == project_id) & (Pattern.name == name)
        )
    ).one()
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


@router.post("/api/project/{project_id}/ppm/save")
async def save_ppm(
    project_id: uuid.UUID,
    pattern: PatternWithDSLApi,
    session: DatabaseSession,
) -> str:
    retrieved_session_pattern = session.exec(
        select(Pattern).where(
            Pattern.project_id == project_id, Pattern.name == pattern.name
        )
    ).one_or_none()
    session_pattern = retrieved_session_pattern or Pattern(
        project_id=project_id, name=pattern.name, json_pattern={}, dsl_content=""
    )
    session_pattern.json_pattern = pattern.model_dump(exclude={"dsl_content"})
    session_pattern.dsl_content = pattern.dsl_content
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
