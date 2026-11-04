import hashlib
import uuid
from dataclasses import dataclass

from pydantic import BaseModel
from pydantic_ai import RunContext, ToolFailed
from sqlmodel import select, text

from app.dependencies import DatabaseSession, get_session
from app.models.sql_model import MatchingProfile, Profile
from app.service import pattern as patterns_service
from app.service.statistics import ScoresStatistics, describe_scores_set
from app.utils.convert_ppm_to_sql import convert_ppm_to_sql_query


@dataclass
class AppAgentDeps:
    project_id: uuid.UUID
    session: DatabaseSession


async def validate_pattern(pattern_dsl: str) -> str:
    """Validate the provided pattern DSL (syntax) to make sure it is a valid
    pattern to be executed.

    Args:
        pattern_dsl (str): the pattern DSL string to be validated

    Returns:
        str: the validation result
    """
    session = next(get_session())
    try:
        await patterns_service.parse_pattern_string(pattern_dsl, session=session)
        return "Valid"
    except ValueError as ve:
        raise ToolFailed(str(ve))


class PatternMatchingExecutionSummary(BaseModel):
    number_matching_groups: int


async def execute_pattern_matching(
    ctx: RunContext[AppAgentDeps],
    pattern_dsl: str,
) -> ScoresStatistics:
    """Execute the given pattern, written in the Canopus DSL, against the project's notebooks
    and return the scores statistics of matching groups.

    Each notebook is associated to maximum one performance score, corresponding to the performance
    of the trained model.

    Args:
        project_id (AppAgentDeps): contextual information
        pattern_dsl (str): the pattern written in the Canopus DSL

    Returns:
        ScoresStatistics: the scores statistics of matching groups among the project's notebooks
    """
    session = ctx.deps.session
    try:
        pattern = await patterns_service.parse_pattern_string(
            pattern_dsl, session=session
        )
    except ValueError as ve:
        raise ToolFailed(str(ve))

    if not pattern.groups:
        raise ToolFailed(
            "The pattern contains no group, which therefore leads to no match."
        )

    pattern_hash = hashlib.md5(pattern_dsl.encode()).hexdigest()

    matching_profiles_scores_query = (
        select(Profile.score)
        .join(MatchingProfile)
        .where(MatchingProfile.pattern_hash == pattern_hash)
    )
    matching_profiles_scores = session.exec(matching_profiles_scores_query).all()

    if not matching_profiles_scores:
        query = convert_ppm_to_sql_query(ctx.deps.project_id, pattern.groups)
        # TODO: fix unecessary groups retrieval here
        unique_matching_profiles = {r[0] for r in session.execute(text(query)).all()}
        session.add_all(
            [
                MatchingProfile(pattern_hash=pattern_hash, profile_id=mp)
                for mp in unique_matching_profiles
            ]
        )
        matching_profiles_scores = session.exec(matching_profiles_scores_query).all()

    return describe_scores_set(matching_profiles_scores)
