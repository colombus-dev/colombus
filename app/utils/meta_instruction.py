from typing import Mapping

from app.models.api_model import PatternMetaInstruction


def clean_meta_instruction(mi: Mapping[str, str | None]) -> PatternMetaInstruction:
    return {
        key: value for key, value in mi.items() if value is not None and value != ""
    }


def has_meta_instruction_value(mi: Mapping[str, str | None]) -> bool:
    return any(value is not None and value != "" for value in mi.values())


def dedupe_meta_instructions(
    meta_instructions: list[PatternMetaInstruction],
) -> list[PatternMetaInstruction]:
    deduped: dict[str, PatternMetaInstruction] = {}
    for mi in meta_instructions:
        if has_meta_instruction_value(mi):
            cleaned = clean_meta_instruction(mi)
            deduped[str(sorted(cleaned.items()))] = cleaned
    return list(deduped.values())
