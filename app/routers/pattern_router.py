import logging
import uuid

import canopus_dsl
import httpx
from fastapi import APIRouter
from pydantic import BaseModel
from sqlmodel import col, select

from app.dependencies import DatabaseSession
from app.exceptions import (
    ElementNotFoundException,
    FlinkGatewayUnavailableException,
    InvalidPatternDefinitionException,
)
from app.models.api_model import Pattern as PatternApi
from app.models.api_model import PatternGroup, PatternWithDSLApi, PpmResult
from app.models.sql_model import Pattern
from app.service.flink_gateway import execute_pattern
from app.service.ppm_matching import extend_trailing_group, resolve_occurrence
from app.utils.convert_canopus_to_legacy import convert_pattern_to_legacy
from app.utils.convert_ppm_to_sql import flatten_pattern
from app.utils.resolve_step_ids import profile_steps

logger = logging.getLogger(__name__)
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


async def _run_ppm(
    project_id: uuid.UUID, pattern: list[PatternGroup], session: DatabaseSession
) -> list[PpmResult]:
    flat_pattern = flatten_pattern(pattern)

    try:
        flink_result = await execute_pattern(str(project_id), flat_pattern)
    except httpx.HTTPStatusError as exc:
        try:
            detail = exc.response.json().get("detail", exc.response.text)
        except ValueError:
            detail = exc.response.text
        if exc.response.status_code == 400:
            raise InvalidPatternDefinitionException(detail)
        logger.error(f"Flink gateway error: {detail}")
        raise FlinkGatewayUnavailableException()
    except httpx.HTTPError as exc:
        logger.error(f"Flink gateway unreachable: {exc}")
        raise FlinkGatewayUnavailableException()

    group_vars = flink_result["group_vars"]

    # Flink does not accept a greedy quantifier at the end, so the last group matched as few steps as possible.
    last_group = flat_pattern[-1]
    has_greedy_last_group = bool(last_group.steps) and last_group.multiplicity in (
        "+",
        "*",
    )

    results: list[PpmResult] = []
    for match in flink_result["matches"]:
        steps_by_position = profile_steps(session, match["profile_id"])
        last_consumed_position = -1
        for occurrence in sorted(match["occurrences"], key=lambda o: o["match_start"]):
            if has_greedy_last_group:
                # Skip occurrences that start inside the previous stretched one.
                if occurrence["match_start"] <= last_consumed_position:
                    continue
                # Stretch the last group over the following matching steps.
                last_consumed_position = extend_trailing_group(
                    last_group, group_vars[-1], occurrence, steps_by_position
                )
            # Spans become step uuids, None means a meta-instruction filter failed.
            group_results = resolve_occurrence(
                session, flat_pattern, group_vars, occurrence, steps_by_position
            )
            if group_results is None:
                continue
            results.append(
                PpmResult(profile_name=match["profile_name"], results=group_results)
            )
    return results


@router.post("/api/project/{project_id}/ppm/execute")
async def execute_ppm(
    project_id: uuid.UUID,
    pattern: list[PatternGroup],
    session: DatabaseSession,
) -> list[PpmResult]:
    return await _run_ppm(project_id, pattern, session)


@router.post("/api/project/{project_id}/ppm/execute/{name}")
async def execute_ppm_with_name(
    project_id: uuid.UUID, name: str, session: DatabaseSession
) -> list[PpmResult]:
    ppm = session.exec(
        select(Pattern.json_pattern).where(
            (Pattern.project_id == project_id) & (Pattern.name == name)
        )
    ).one()
    return await _run_ppm(project_id, [PatternGroup(**ppm)], session)


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
