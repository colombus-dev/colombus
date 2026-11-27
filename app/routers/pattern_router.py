import canopus_dsl
from fastapi import APIRouter
from pydantic import BaseModel
from sqlmodel import col, select

from app.dependencies import DatabaseSession
from app.exceptions import ElementNotFoundException, InvalidPatternDefinitionException
from app.models.api_model import (
    IdStr,
    PatternGroup,
    PatternWithDSLApi,
    PpmResult,
    SavedPattern,
)
from app.models.api_model import Pattern as PatternApi
from app.models.sql_model import Pattern
from app.service.ppm_flink import run_ppm_flink
from app.utils import natural_key
from app.utils.convert_canopus_to_legacy import convert_pattern_to_legacy

router = APIRouter()

# TODO: support multiple (sub)-patterns


@router.get("/api/projects/{project_id}/patterns")
async def get_all_ppm(
    project_id: int,
    session: DatabaseSession,
) -> list[SavedPattern]:
    retrieved_patterns = session.exec(
        select(Pattern.id, Pattern.json_pattern, Pattern.dsl_content)
        .where(Pattern.project_id == project_id)
        .order_by(Pattern.name)
    ).all()
    return [
        SavedPattern(id=p[0], dsl_content=p[2] or "", **p[1])
        for p in retrieved_patterns
    ]


class ParsePpmParams(BaseModel):
    pattern_dsl: str


@router.post("/api/projects/{project_id}/patterns/parse")
async def parse_ppm(
    project_id: int,
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


def _sort_by_profile_name(results: list[PpmResult]) -> list[PpmResult]:
    return sorted(results, key=lambda result: natural_key(result.profile_name))


@router.post("/api/projects/{project_id}/patterns/execute")
async def execute_ppm(
    project_id: int,
    pattern: list[PatternGroup],
    session: DatabaseSession,
) -> list[PpmResult]:
    results = await run_ppm_flink(project_id, pattern, session)
    return _sort_by_profile_name(results)


@router.post("/api/projects/{project_id}/patterns/{pattern_id}/execute")
async def execute_saved_ppm(
    project_id: int, pattern_id: int, session: DatabaseSession
) -> list[PpmResult]:
    ppm = session.exec(
        select(Pattern.json_pattern).where(
            (Pattern.project_id == project_id) & (Pattern.id == pattern_id)
        )
    ).one()
    groups = PatternApi(**ppm).groups or []
    results = await run_ppm_flink(project_id, groups, session)
    return _sort_by_profile_name(results)


@router.post("/api/projects/{project_id}/patterns")
async def save_ppm(
    project_id: int,
    pattern: PatternWithDSLApi,
    session: DatabaseSession,
) -> IdStr:
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
    return session_pattern.id


@router.delete("/api/projects/{project_id}/patterns/{pattern_id}")
async def delete_ppm(project_id: int, pattern_id: int, session: DatabaseSession):
    pattern = session.exec(
        select(Pattern).where(
            Pattern.project_id == project_id, Pattern.id == pattern_id
        )
    ).one_or_none()
    if not pattern:
        raise ElementNotFoundException("pattern")
    session.delete(pattern)
    session.commit()
