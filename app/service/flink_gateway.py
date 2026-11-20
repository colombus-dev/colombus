import httpx

from app.models.api_model import PatternGroup
from app.settings import get_settings

FLINK_GATEWAY_TIMEOUT = 60 * 2
settings = get_settings()


async def execute_pattern(project_id: str, pattern: list[PatternGroup]) -> dict:
    if settings.flink_gateway_api_url_prefix is None:
        raise RuntimeError("FLINK_GATEWAY_API_URL_PREFIX is not set")
    async with httpx.AsyncClient(
        base_url=settings.flink_gateway_api_url_prefix
    ) as client:
        response = await client.post(
            "/execute",
            json={
                "project_id": project_id,
                "pattern": [
                    group.model_dump(exclude={"subpattern"}) for group in pattern
                ],
            },
            timeout=FLINK_GATEWAY_TIMEOUT,
        )
        response.raise_for_status()
        return response.json()
