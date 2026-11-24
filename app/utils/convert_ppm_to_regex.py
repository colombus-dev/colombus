from app.models.api_model import PatternGroup
from app.utils import format_template
from app.utils.flatten_pattern import flatten_pattern
from app.utils.meta_instruction import dedupe_meta_instructions


def convert_pattern_to_regex(pattern: list[PatternGroup]) -> str:
    flat_pattern = flatten_pattern(pattern)
    converted_regex = r""

    value_placeholder = r'[^"]*'

    for group in flat_pattern:
        if group.metaCharacters.startsWith:
            converted_regex += r"^"
        if not group.steps:
            converted_regex += r".*?"
        else:
            converted_regex += r"("
            if group.metaCharacters.negate:
                # TODO: currently not supporting negate
                # converted_regex += "^"
                ...

            # TODO: currently only supporting one metainstruction per group
            reduced_meta_instructions = dedupe_meta_instructions(
                group.metaInstructions or []
            )
            current_attributes = (
                {
                    key: value if value != "" else value_placeholder
                    for key, value in reduced_meta_instructions[0].items()
                    if value is not None
                }
                if len(reduced_meta_instructions) > 0
                else {}
            )

            converted_regex += format_template(
                step_name="|".join(step_name for step_name in group.steps),
                attributes=current_attributes,
            )
            if group.multiplicity and group.multiplicity != "1":
                # TODO: currently not supporting multiplicity
                # converted_regex += group.multiplicity
                ...
            converted_regex += r")"
        if group.metaCharacters.endsWith:
            converted_regex += r"$"

    return converted_regex
