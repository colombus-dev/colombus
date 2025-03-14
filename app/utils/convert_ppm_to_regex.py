from app.models.api_model import PatternGroup, PatternMetaInstruction
from app.utils import format_template


def flatten_pattern(pattern: list[PatternGroup]) -> list[PatternGroup]:
    flattened_pattern = []
    for group in pattern:
        if group.subpattern:
            flattened_pattern.extend(flatten_pattern(group.subpattern.groups))
        else:
            flattened_pattern.append(group)
    return flattened_pattern


def convert_pattern_to_regex(pattern: list[PatternGroup]) -> str:
    flat_pattern = flatten_pattern(pattern)
    count_groups = len([g for g in flat_pattern if g.steps])
    converted_regex = ""

    def __reduce_meta_instructions(_mi_list: list[PatternMetaInstruction]):
        return list(
            {
                f"{mi.algoFamily}_{mi.algoName}_{mi.library}_{mi.function}": mi
                for mi in _mi_list
                if mi.algoFamily or mi.algoName or mi.library or mi.function
            }.values()
        )

    value_placeholder = '[^"]*'

    for group in flat_pattern:
        if group.metaCharacters.startsWith:
            converted_regex += "^"
        if not group.steps:
            converted_regex += ".*?"
        else:
            converted_regex += "("
            if group.metaCharacters.negate:
                # TODO: currently not supporting negate
                # converted_regex += "^"
                ...

            # TODO: currently only supporting one metainstruction per group
            current_metainstruction = (
                __reduce_meta_instructions(group.metaInstructions)[0]
                if group.metaInstructions
                and __reduce_meta_instructions(group.metaInstructions)
                and (
                    group.metaInstructions[0].algoFamily
                    or group.metaInstructions[0].algoName
                    or group.metaInstructions[0].library
                    or group.metaInstructions[0].function
                )
                else None
            )

            converted_regex += format_template(
                step_name="|".join(step_name for step_name in group.steps),
                algo_family=(
                    current_metainstruction.algoFamily
                    if current_metainstruction and current_metainstruction.algoFamily
                    else value_placeholder
                ),
                algo_name=(
                    current_metainstruction.algoName
                    if current_metainstruction and current_metainstruction.algoName
                    else value_placeholder
                ),
                library=(
                    current_metainstruction.library
                    if current_metainstruction and current_metainstruction.library
                    else value_placeholder
                ),
                function=(
                    current_metainstruction.function
                    if current_metainstruction and current_metainstruction.function
                    else value_placeholder
                ),
            )
            if group.multiplicity and group.multiplicity != "1":
                # TODO: currently not supporting multiplicity
                # converted_regex += group.multiplicity
                ...
            converted_regex += ")"
        if group.metaCharacters.endsWith:
            converted_regex += "$"

    return converted_regex
