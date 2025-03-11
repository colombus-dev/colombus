import uuid

from typing import Any

from app.models.api_model import PatternGroup


METACHARACTER_STARTS = "^"
METACHARACTER_ENDS = "$"
METACHARACTER_OR = "|"
METACHARACTER_NOT = "!"
METACHARACTER_STAR = "*"
METACHARACTER_PLUS = "+"


def convert_meta_instructions_to_sql_query(
    meta_instructions: list[dict[str, Any]], step_pos: int
) -> tuple[str, str]:
    names_to_pos = {}
    prefix_query = ""
    join_query = ""
    where_query = ""
    for mi_i, mi in enumerate(meta_instructions):
        if mi == METACHARACTER_STAR:
            continue
        names_to_pos[mi_i] = mi

        prefix_query += f", mi{step_pos}_{mi_i}.id"
        join_query += f"\nINNER JOIN meta_instruction AS mi{step_pos}_{mi_i} ON s{step_pos}.id = mi{step_pos}_{mi_i}.step_id"

    prev_pos = -1
    for mi_i, mi in names_to_pos.items():
        for k, v in mi.items():
            if k != "tasks" and v != METACHARACTER_STAR:
                where_query += f' AND mi{step_pos}_{mi_i}.{k} = "{v}"'
        if prev_pos > -1:
            diff = mi_i - prev_pos
            where_query += f" AND mi{step_pos}_{mi_i}.position - mi{step_pos}_{prev_pos}.position {'=' if diff == 1 else '>='} 1"
        prev_pos = mi_i
        if mi_i < len(meta_instructions) - 1:
            where_query += " AND"

    return prefix_query, join_query, where_query


def flatten_pattern(pattern: list[PatternGroup]) -> list[PatternGroup]:
    flattened_pattern = []
    for group in pattern:
        if group.subpattern:
            flattened_pattern.extend(flatten_pattern(group.subpattern.groups))
        else:
            flattened_pattern.append(group)
    return flattened_pattern


def convert_or_not_stmt(sql_step_name: str, step: PatternGroup):
    return (
        ("NOT (" if step.metaCharacters.negate else "(")
        + " OR ".join(f"{sql_step_name} = '{or_name}'" for or_name in step.steps)
        + ")"
    )


def convert_steps_to_sql_query(
    project_id: uuid.UUID, pattern: list[PatternGroup]
) -> str:
    # TODO: BUG: zero or more (any) -> at least one ("lib_loading") -> at least one ("data_prep") -> zero or more (any)
    step_to_pos: dict[str, PatternGroup] = {}
    all_cte_clauses = [
        f"FROM (SELECT * FROM profile WHERE project_id = '{project_id.hex}') AS p"
    ]
    all_select_clauses = []
    all_groups_select_clauses = []
    all_groupby_clauses = []
    all_having_clauses = []

    flat_pattern = flatten_pattern(pattern)

    for se_i, step in enumerate(flat_pattern):
        if len(step.steps) == 0:
            continue
        step_to_pos[se_i] = step

    prev_pos = -1
    prev_sql_position = -1
    for se_i, step in step_to_pos.items():
        sql_max_position = f"MAX(s{se_i}_pos)"
        sql_min_position = f"MIN(s{se_i}_pos)"

        if step.multiplicity in (METACHARACTER_PLUS, METACHARACTER_STAR):
            grp_condition = convert_or_not_stmt("name", step)
            join_type = (
                "INNER" if step.multiplicity == METACHARACTER_PLUS else "LEFT OUTER"
            )
            join_condition = (
                f"s{se_i}.id != s{prev_pos}.id AND s{se_i}.profile_id = s{prev_pos}.profile_id AND s{se_i}.position > s{prev_pos}.position"
                if prev_pos > -1
                else f"s{se_i}.profile_id = p.id"
            )
            all_cte_clauses.append(
                f"""
            {join_type} JOIN (
                SELECT id, profile_id, position, position - DENSE_RANK() OVER(partition by profile_id ORDER BY position) AS grp
                FROM step
                WHERE {grp_condition}
            ) AS s{se_i} ON {join_condition}
            """
            )

            all_groups_select_clauses.append(
                f"s{se_i}.id as s{se_i}_id, s{se_i}.position AS s{se_i}_pos, s{se_i}.grp as s{se_i}_grp, s{se_i}.profile_id AS s{se_i}_profile_id"
            )

            if step.multiplicity == METACHARACTER_PLUS:
                all_select_clauses.append(
                    f"string_agg(DISTINCT s{se_i}_id::text, ',') AS res_grp_concat_s{se_i}"
                )
            elif prev_pos > -1:
                all_select_clauses.append(
                    f"CASE WHEN {sql_min_position} - MAX(s{prev_pos}_pos) > 1 THEN NULL ELSE string_agg(DISTINCT s{se_i}_id::text, ',') END AS res_grp_concat_s{se_i}"
                )

            all_groupby_clauses.append(f"s{se_i}_grp")
            if step.multiplicity != METACHARACTER_STAR and prev_pos > -1:
                diff = se_i - prev_pos
                all_having_clauses.append(
                    f"{sql_max_position} - {prev_sql_position} {'=' if diff == 1 else '>='} 1"
                )
        else:
            all_groups_select_clauses.append(
                f"s{se_i}.name AS s{se_i}_name, s{se_i}.id AS s{se_i}_id, s{se_i}.position AS s{se_i}_pos, s{se_i}.profile_id AS s{se_i}_profile_id"
            )
            all_select_clauses.append(f"s{se_i}_id")

            optimized_join_condition = (
                f"INNER JOIN step AS s{se_i} ON p.id = s{se_i}.profile_id AND "
            )
            if prev_pos > -1:
                optimized_join_condition += (
                    f"s{se_i}.previous_step_id = s{prev_pos}.id AND "
                )

            all_cte_clauses.append(
                optimized_join_condition + convert_or_not_stmt(f"s{se_i}.name", step)
            )
            all_groupby_clauses.append(f"s{se_i}_id")

        if se_i == 0 and step.metaCharacters.startsWith:
            # pattern strict starts with step_name
            all_having_clauses.append(f"{sql_min_position} = 0")
        if se_i == len(flat_pattern) - 1 and step.metaCharacters.endsWith:
            # pattern strict ends with step_name
            all_having_clauses.append(
                f"{sql_max_position} = (SELECT max(position) FROM step AS substep WHERE substep.profile_id = s{se_i}_profile_id)"
            )

        # TODO: ==================== [WIP] META INSTRUCTIONS ====================
        prev_mi_i: int | None = None
        for mi_i, mi in enumerate(step.metaInstructions or []):
            all_groups_select_clauses.append(f"mi_{se_i}_{mi_i}.id AS mi_{se_i}_{mi_i}_id")
            all_select_clauses.append(f"mi_{se_i}_{mi_i}_id")
            optimized_join_condition = (
                f"INNER JOIN metainstruction AS mi_{se_i}_{mi_i} ON mi_{se_i}_{mi_i}.profile_id = s{se_i}.profile_id AND mi_{se_i}_{mi_i}.step_id = s{se_i}.id"
            )
            if mi.library:
                optimized_join_condition += f" AND mi_{se_i}_{mi_i}.library = '{mi.library}'"
            if mi.function:
                optimized_join_condition += f" AND mi_{se_i}_{mi_i}.function = '{mi.function}'"
            if prev_mi_i is not None:
                optimized_join_condition += f" AND mi_{se_i}_{mi_i}.position > mi_{prev_mi_i}.position"
            all_cte_clauses.append(optimized_join_condition)
            all_groupby_clauses.append(f"mi_{se_i}_{mi_i}_id")
            prev_mi_i = mi_i

        # =======================================================================

        prev_pos = se_i
        prev_sql_position = sql_max_position

    from jinja2 import Environment, PackageLoader, select_autoescape

    env = Environment(loader=PackageLoader("app"), autoescape=select_autoescape())
    template = env.get_template("ppm_template.sql")

    return template.render(
        all_groups_select_clauses=all_groups_select_clauses,
        all_cte_clauses=all_cte_clauses,
        all_select_clauses=all_select_clauses,
        all_groupby_clauses=all_groupby_clauses,
        all_having_clauses=all_having_clauses,
    )


def convert_ppm_to_sql_query(project_id: uuid.UUID, pattern: list[PatternGroup]):
    print(convert_steps_to_sql_query(project_id, pattern))
    return convert_steps_to_sql_query(project_id, pattern)
