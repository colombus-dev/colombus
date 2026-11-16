import uuid

from sqlmodel import Session

from app.models.api_model import PatternGroup
from app.utils.flink_resolve_meta_instructions import resolve_group_meta_instructions
from app.utils.flink_resolve_step_ids import group_matches_step


def extend_trailing_group(
    group: PatternGroup,
    var: str,
    occurrence: dict,
    steps_by_position: dict[int, tuple[uuid.UUID, str]],
) -> int:
    # Take every step after the match that still fits the group, like greedy would have.
    group_ranges = occurrence["ranges"]
    var_range = group_ranges[var]
    end = var_range[1] if var_range is not None else occurrence["match_end"]
    while end + 1 in steps_by_position and group_matches_step(
        group, steps_by_position[end + 1][1]
    ):
        end += 1
    if var_range is not None:
        group_ranges[var] = [var_range[0], end]
    elif end > occurrence["match_end"]:
        group_ranges[var] = [occurrence["match_end"] + 1, end]
    # Last position now covered by this occurrence.
    return max(occurrence["match_end"], end)


def resolve_occurrence(
    session: Session,
    pattern: list[PatternGroup],
    group_vars: list[str],
    occurrence: dict,
    steps_by_position: dict[int, tuple[uuid.UUID, str]],
) -> list[list[uuid.UUID]] | None:
    group_results = []
    for group, var in zip(pattern, group_vars):
        # Wildcard groups and groups that matched nothing produce no uuid list.
        if not group.steps:
            continue
        var_range = occurrence["ranges"][var]
        if var_range is None:
            continue
        step_ids = [
            steps_by_position[position][0]
            for position in range(var_range[0], var_range[1] + 1)
            if position in steps_by_position
        ]
        if group.metaInstructions:
            # None means no step carries the required chain, the occurrence is dropped.
            resolved = resolve_group_meta_instructions(
                session, step_ids, group.metaInstructions
            )
            if resolved is None:
                return None
        else:
            resolved = step_ids
        if resolved:
            group_results.append(resolved)
    return group_results
