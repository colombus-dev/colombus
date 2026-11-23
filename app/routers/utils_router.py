import uuid
from typing import Sequence

from fastapi import APIRouter
from sqlmodel import select

from app.dependencies import DatabaseSession
from app.models.api_model import PatternGroup, RegexCompatibleProfileElement
from app.models.api_model import Profile as JsonProfile
from app.models.sql_model import CellOutput
from app.utils.convert_ppm_to_regex import convert_pattern_to_regex

router = APIRouter()


@router.get("/api/projects/{project_id}/steps/{step_id}/outputs")
async def get_step_output(
    project_id: uuid.UUID,
    step_id: uuid.UUID,
    session: DatabaseSession,
) -> Sequence[str]:
    # TODO: migrate to utils or dedicated router
    return session.exec(
        select(CellOutput.image).where(CellOutput.step_id == step_id)
    ).all()


@router.post("/api/utils/regex/pattern")
async def generate_pattern_regex(pattern: list[PatternGroup]) -> str:
    return convert_pattern_to_regex(pattern)


@router.post("/api/utils/regex/profile")
async def generate_profile_regex(
    profile: JsonProfile,
) -> list[RegexCompatibleProfileElement]:
    return [
        {
            "step": se["name"],
            **{
                key: ", ".join(value) if isinstance(value, list) else value
                for key, value in sorted(mi.items())
                if isinstance(value, (str, list))
            },
        }
        for se in profile.source
        for mi in se["tasks"]
    ]
