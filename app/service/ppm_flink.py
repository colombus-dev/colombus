import logging
import uuid

import httpx
from sqlmodel import Session

from app.exceptions import (
    FlinkGatewayUnavailableException,
    InvalidPatternDefinitionException,
)
from app.models.api_model import PatternGroup, PpmResult
from app.service.flink_gateway import execute_pattern
from app.service.ppm_flink_matching import extend_trailing_group, resolve_occurrence
from app.utils.flatten_pattern import flatten_pattern
from app.utils.flink_resolve_step_ids import profile_steps

logger = logging.getLogger(__name__)


async def run_ppm_flink(
    project_id: uuid.UUID, pattern: list[PatternGroup], session: Session
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
