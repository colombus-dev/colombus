# import uuid

# import ai
# from sqlmodel import text

# from app.dependencies import get_session
# from app.models.api_model import PpmResult
# from app.service import pattern as patterns_service
# from app.utils.convert_ppm_to_sql import convert_ppm_to_sql_query


# @ai.tool
# async def validate_pattern(
#     # runtime: ai.Runtime,
#     pattern_dsl: str,
# ) -> str:
#     """Validate the provided pattern DSL (syntax) to make sure it is a valid
#     pattern to be executed.

#     Args:
#         pattern_dsl (str): the pattern DSL string to be validated

#     Returns:
#         str: the validation result
#     """
#     session = next(get_session())
#     try:
#         await patterns_service.parse_pattern_string(pattern_dsl, session=session)
#         return "Valid"
#     except ValueError as ve:
#         return str(ve)


# @ai.tool(require_approval=True)
# async def execute_pattern_matching(
#     project_id: uuid.UUID,
#     pattern_dsl: str,
# ) -> int:
#     """Execute the given pattern, written in the Canopus DSL, against the project's notebooks
#     and return the number of matching groups.

#     Args:
#         project_id (uuid.UUID): the project's id to look for matching pattern groups
#         pattern_dsl (str): the pattern written in the Canopus DSL

#     Returns:
#         int: the number of matching groups among the project's notebooks
#     """
#     print("project_id=", project_id)
#     print("pattern_dsl=", pattern_dsl)
#     session = next(get_session())
#     pattern = await patterns_service.parse_pattern_string(pattern_dsl, session=session)
#     print("PATTERN=", pattern)
#     if not pattern.groups:
#         return 0  # TODO: or raise?
#     query = convert_ppm_to_sql_query(project_id, pattern.groups)
#     # TODO: improve this uuid conversion
#     return len(
#         [
#             PpmResult(
#                 profile_name=r[0],
#                 results=[
#                     [e for e in f if e is not None] for f in r[1:] if f is not None
#                 ],
#             )
#             for r in session.execute(text(query)).all()
#         ]
#     )


import uuid
from dataclasses import dataclass

from pydantic_ai import RunContext
from sqlmodel import text

from app.dependencies import get_session
from app.models.api_model import PpmResult
from app.service import pattern as patterns_service
from app.utils.convert_ppm_to_sql import convert_ppm_to_sql_query


@dataclass
class AppAgentDeps:
    project_id: uuid.UUID


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
        return str(ve)


async def execute_pattern_matching(
    ctx: RunContext[AppAgentDeps],
    pattern_dsl: str,
) -> int:
    """Execute the given pattern, written in the Canopus DSL, against the project's notebooks
    and return the number of matching groups.

    Args:
        project_id (AppAgentDeps): contextual information
        pattern_dsl (str): the pattern written in the Canopus DSL

    Returns:
        int: the number of matching groups among the project's notebooks
    """
    print("project_id=", ctx.deps.project_id)
    print("pattern_dsl=", pattern_dsl)
    session = next(get_session())
    pattern = await patterns_service.parse_pattern_string(pattern_dsl, session=session)
    if not pattern.groups:
        return 0  # TODO: or raise?
    query = convert_ppm_to_sql_query(ctx.deps.project_id, pattern.groups)
    # TODO: improve this uuid conversion
    return len(
        [
            PpmResult(
                profile_name=r[0],
                results=[
                    [e for e in f if e is not None] for f in r[1:] if f is not None
                ],
            )
            for r in session.execute(text(query)).all()
        ]
    )
