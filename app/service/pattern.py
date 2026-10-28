import canopus_dsl
from sqlmodel import Session, col, select

from app.models.api_model import Pattern as PatternApi
from app.models.sql_model import Pattern
from app.utils.convert_canopus_to_legacy import convert_pattern_to_legacy


async def parse_pattern_string(pattern_dsl_string: str, session: Session) -> PatternApi:
    canopus_listener = canopus_dsl.parse_string(pattern_dsl_string)
    if not canopus_listener.program:
        raise ValueError("Invalid pattern string.")
    all_patterns_names = [p.name for p in canopus_listener.program.patterns]
    all_imports_to_load = [
        imp for imp in canopus_listener.program.imports if imp not in all_patterns_names
    ]
    imported_patterns = [
        PatternApi(**imp_p)  # pyright: ignore[reportUnknownArgumentType]
        for imp_p in session.exec(  # pyright: ignore[reportUnknownVariableType]
            select(Pattern.json_pattern).where(
                col(Pattern.name).in_(all_imports_to_load)
            )  # pyright: ignore[reportUnknownArgumentType]
        ).all()
    ]
    return convert_pattern_to_legacy(
        canopus_listener.program.patterns[:-1],
        canopus_listener.program.patterns[-1],
        imported_patterns,
    )
