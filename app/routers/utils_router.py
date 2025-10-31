import uuid
from difflib import SequenceMatcher
from typing import Sequence

from fastapi import APIRouter
from pydantic import BaseModel
from sqlmodel import select

from app.constants import __TMP_ENCODING_MAPPING
from app.dependencies import DatabaseSession
from app.models.api_model import (
    DiffResult,
    PatternGroup,
)
from app.models.api_model import Profile as JsonProfile
from app.models.api_model import (
    RegexCompatibleProfileElement,
)
from app.models.sql_model import CellOutput, Profile, Step
from app.utils.convert_ppm_to_regex import convert_pattern_to_regex


router = APIRouter()


@router.get("/api/project/{project_id}/profile/step/{step_id}/output")
async def get_step_output(
    project_id: uuid.UUID,
    step_id: uuid.UUID,
    session: DatabaseSession,
) -> Sequence[str]:
    # TODO: migrate to utils or dedicated router
    return session.exec(
        select(CellOutput.image).where(CellOutput.step_id == step_id)
    ).all()


@router.post("/api/utils/generate/regex/pattern")
async def generate_pattern_regex(pattern: list[PatternGroup]) -> str:
    return convert_pattern_to_regex(pattern)


@router.post("/api/utils/generate/regex/profile")
async def generate_profile_regex(
    profile: JsonProfile,
) -> list[RegexCompatibleProfileElement]:
    return [
        RegexCompatibleProfileElement(
            step=se["name"],
            algoFamily=mi["algoFamily"],
            algoName=mi["algoName"],
            library=mi["library"],
            function=mi["function"],
        )
        for se in profile.source
        for mi in se["tasks"]
    ]


class PostDiffSortPayload(BaseModel):
    profiles_to_diff: list[str]


@router.post("/api/utils/diff/sort")
async def post_diff_sort(
    payload: PostDiffSortPayload, session: DatabaseSession
) -> list[DiffResult]:
    if len(payload.profiles_to_diff) == 1:
        return []

    profiles_ids: list[uuid.UUID] = []
    for ptd in payload.profiles_to_diff:
        profile_id = session.exec(select(Profile.id).where(Profile.name == ptd)).first()
        if profile_id:
            profiles_ids.append(profile_id)

    profiles_content: list[Sequence[tuple[uuid.UUID, str]]] = []
    for pid in profiles_ids:
        profiles_content.append(
            session.exec(select(Step.id, Step.name).where(Step.profile_id == pid)).all()
        )

    results: list[DiffResult] = []
    ref_element = "-".join(
        [__TMP_ENCODING_MAPPING[pe[1]] for pe in profiles_content[0]]
    )
    seq_match = SequenceMatcher(isjunk=None, a=ref_element)

    for i, (ptd, pc) in enumerate(zip(payload.profiles_to_diff, profiles_content)):
        seq_match.set_seq2("-".join([__TMP_ENCODING_MAPPING[pe[1]] for pe in pc]))
        results.append(
            DiffResult(
                profile_name=ptd,
                results=[
                    [e[0] for e in profiles_content[i][b[1] : b[1] + b[2]]]
                    for b in seq_match.get_matching_blocks()[:-1]
                ],
                ratio=seq_match.ratio(),
            )
        )

    return sorted(results, key=lambda r: r.ratio, reverse=True)
