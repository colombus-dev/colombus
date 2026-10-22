from app.models.parser import ParserFunction
from app.parsers.base import BaseMLParser
from app.parsers.dspipelines import DSPipelinesParser
from app.parsers.vespucci import VespucciParser


def get_parser(parser_name: ParserFunction) -> BaseMLParser:
    match parser_name:
        case ParserFunction.DSPIPELINES.value:
            return DSPipelinesParser()
        case ParserFunction.VESPUCCI.value:
            return VespucciParser()
        case _:
            raise ValueError(f"Invalid parser name [{parser_name}].")
