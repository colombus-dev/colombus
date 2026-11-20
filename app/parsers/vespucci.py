import httpx

from app.models.parser import ParserSubgraph, ParserSubgraphList
from app.parsers.base import BaseMLParser
from app.settings import get_settings

settings = get_settings()

PARSER_API_TIMEOUT = 2


class VespucciParser(BaseMLParser):
    def __init__(self):
        super().__init__()

    async def parse_code(
        self, python_code: str, parse_subscript: bool = True
    ) -> list[ParserSubgraph]:
        parser_response = httpx.post(
            f"{settings.vespucci_parser_api_url_prefix}/parse",
            json={
                "source": python_code,
            },
            timeout=PARSER_API_TIMEOUT,
        )
        parser_response.raise_for_status()
        parser_response = parser_response.json()
        return sorted(
            ParserSubgraphList.validate_python(parser_response),
            key=lambda pr: (pr.line.start, pr.cursor.start),
        )
