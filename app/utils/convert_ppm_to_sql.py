import uuid

from app.models.api_model import PatternGroup
from app.utils import encode_step_name


def flatten_pattern(pattern: list[PatternGroup]) -> list[PatternGroup]:
    flattened_pattern = []
    for group in pattern:
        if group.subpattern:
            flattened_pattern.extend(flatten_pattern(group.subpattern.groups))
        else:
            flattened_pattern.append(group)
    return flattened_pattern


def convert_steps_to_sql_query(
    project_id: uuid.UUID, pattern: list[PatternGroup]
) -> str:
    count_groups = len([g for g in flatten_pattern(pattern) if g.steps])
    converted_regex = ""
    for group in pattern:
        if group.metaCharacters.startsWith:
            converted_regex += "^"
        if not group.steps:
            converted_regex += ".*"
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

    query = f"SELECT p.name"
    for se_i, group in zip(range(0, count_groups + 1, 2), pattern):
        query += f", array_agg(s{se_i}.id::text)"
        for mi_i, _ in enumerate(group.metaInstructions or []):
            query += f" || array_agg(mi_{se_i}_{mi_i}.id::text)"
        query += f" AS res_{se_i}"

    prev_mi_i: int | None = None
    query += f"\nFROM (SELECT id, name, ppm_to_regex('{converted_regex}', encoded_profile, {count_groups}) AS regex_res FROM profile) AS p"
    for se_i, group in zip(range(0, count_groups + 1, 2), pattern):
        query += f"\n{'LEFT OUTER' if group.multiplicity == '*' else 'INNER'} JOIN (SELECT *, 's{se_i}' AS grp_id FROM step) AS s{se_i} ON p.id = s{se_i}.profile_id AND s{se_i}.position >= p.regex_res[{se_i + 1}] AND s{se_i}.position < p.regex_res[{se_i + 2}]"
        for mi_i, mi in enumerate(group.metaInstructions or []):
            query += f"\nINNER JOIN metainstruction AS mi_{se_i}_{mi_i} ON mi_{se_i}_{mi_i}.profile_id = s{se_i}.profile_id AND mi_{se_i}_{mi_i}.step_id = s{se_i}.id"
            if mi.library:
                query += f" AND mi_{se_i}_{mi_i}.library = '{mi.library}'"
            if mi.function:
                query += f" AND mi_{se_i}_{mi_i}.function = '{mi.function}'"
            if prev_mi_i is not None:
                query += (
                    f" AND mi_{se_i}_{mi_i}.position > mi_{se_i}_{prev_mi_i}.position"
                )
            prev_mi_i = mi_i

    query += "\nGROUP BY p.name"
    for se_i in range(0, count_groups + 1, 2):
        query += f", s{se_i}.grp_id"

    return query + ";"


def convert_ppm_to_sql_query(project_id: uuid.UUID, pattern: list[PatternGroup]):
    print(convert_steps_to_sql_query(project_id, pattern))
    return convert_steps_to_sql_query(project_id, pattern)
