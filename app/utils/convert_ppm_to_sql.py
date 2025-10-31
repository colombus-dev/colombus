import uuid

from app.models.api_model import PatternGroup, PatternMetaInstruction
from app.utils import encode_step_name


def flatten_pattern(pattern: list[PatternGroup]) -> list[PatternGroup]:
    flattened_pattern = []
    for group in pattern:
        if group.subpattern:
            flattened_pattern.extend(flatten_pattern(group.subpattern.groups))
        else:
            flattened_pattern.append(group)
    return flattened_pattern


def convert_steps_to_sql_query_template(
    project_id: uuid.UUID, pattern: list[PatternGroup]
) -> str:
    flat_pattern = flatten_pattern(pattern)
    converted_regex = ""
    for group in flat_pattern:
        if group.metaCharacters.startsWith:
            converted_regex += "^"
        if not group.steps:
            converted_regex += ".*?"
        else:
            converted_regex += "(["
            if group.metaCharacters.negate:
                converted_regex += "^"
            converted_regex += (
                "|".join(encode_step_name(step_name) for step_name in group.steps) + "]"
            )
            if group.multiplicity and group.multiplicity != "1":
                converted_regex += group.multiplicity
            converted_regex += ")"
        if group.metaCharacters.endsWith:
            converted_regex += "$"

    def __reduce_meta_instructions(_mi_list: list[PatternMetaInstruction]):
        return list(
            {
                f"{mi.algoFamily}_{mi.algoName}_{mi.library}_{mi.function}": mi
                for mi in _mi_list
                if mi.algoFamily or mi.algoName or mi.library or mi.function
            }.values()
        )

    all_groups = [
        {
            "is_required": g.multiplicity != "*",
            "meta_instructions": __reduce_meta_instructions(g.metaInstructions or []),
            # TODO
            # or [
            #     PatternMetaInstruction(
            #         algoFamily=None, algoName=None,
            #         library=None, function=None
            #     )
            # ],
        }
        for g in flat_pattern
        if g.steps
    ]

    from jinja2 import Environment, PackageLoader, select_autoescape

    env = Environment(loader=PackageLoader("app"), autoescape=select_autoescape())
    template = env.get_template("ppm_template_regex.sql")

    return template.render(
        project_id=project_id,
        regex_text=converted_regex,
        all_groups=all_groups,
    )


def convert_ppm_to_sql_query(project_id: uuid.UUID, pattern: list[PatternGroup]):
    generated_query = convert_steps_to_sql_query_template(project_id, pattern)
    print(generated_query)
    return generated_query
