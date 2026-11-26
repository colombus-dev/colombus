from fastapi import APIRouter

from app.models.api_model import PatternGroup, RegexCompatibleProfileElement
from app.models.api_model import Profile as JsonProfile
from app.utils.convert_ppm_to_regex import convert_pattern_to_regex

router = APIRouter()


@router.post("/api/utils/regex/pattern")
async def generate_pattern_regex(pattern: list[PatternGroup]) -> str:
    return convert_pattern_to_regex(pattern)


@router.post("/api/utils/regex/profile")
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
