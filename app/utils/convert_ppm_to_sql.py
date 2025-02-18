import uuid

from typing import Any


def convert_meta_instructions_to_sql_query(
    meta_instructions: list[dict[str, Any]], step_pos: int
) -> tuple[str, str]:
    names_to_pos = {}
    prefix_query = ""
    join_query = ""
    where_query = ""
    for mi_i, mi in enumerate(meta_instructions):
        if mi == "*":
            continue
        names_to_pos[mi_i] = mi

        prefix_query += f", mi{step_pos}_{mi_i}.id"
        join_query += f"\nINNER JOIN meta_instruction AS mi{step_pos}_{mi_i} ON s{step_pos}.id = mi{step_pos}_{mi_i}.step_id"

    prev_pos = -1
    for mi_i, mi in names_to_pos.items():
        for k, v in mi.items():
            if k != "tasks" and v != "*":
                where_query += f' AND mi{step_pos}_{mi_i}.{k} = "{v}"'
        if prev_pos > -1:
            diff = mi_i - prev_pos
            where_query += f" AND mi{step_pos}_{mi_i}.position - mi{step_pos}_{prev_pos}.position {'=' if diff == 1 else '>='} 1"
        prev_pos = mi_i
        if mi_i < len(meta_instructions) - 1:
            where_query += " AND"

    return prefix_query, join_query, where_query


def flatten_pattern(pattern: list[dict[str, Any]]) -> list[dict[str, Any]]:
    flattened_pattern = []
    for se in pattern:
        if se["type"] == "subpattern":
            flattened_pattern.extend(flatten_pattern(se["tasks"]))
        else:
            flattened_pattern.append(se)
    return flattened_pattern


def convert_or_not_stmt(sql_step_name: str, step_name: str):
    return (
        ("NOT (" if step_name.startswith("!") else "(")
        + " OR ".join(
            f'{sql_step_name} = "{or_name}"'
            for or_name in step_name.replace("!", "").split("|")
        )
        + ")"
    )


def convert_steps_to_sql_query(
    project_id: uuid.UUID, pattern: list[dict[str, Any]]
) -> str:
    names_to_pos = {}
    all_cte_clauses = [
        f'FROM (SELECT * FROM profile WHERE project_id LIKE "{project_id.hex}") AS p'
    ]
    all_select_clauses = ["name"]
    all_groups_select_clauses = ["p.id as profile_id", "p.name"]
    all_where_clauses = []
    all_groupby_clauses = ["profile_id", "name"]
    all_having_clauses = []

    flat_pattern = flatten_pattern(pattern)

    prev_se_i_group: int | None = None
    for se_i, step in enumerate(flat_pattern):
        if step["name"] == "*":
            continue
        names_to_pos[se_i] = step["name"]

        if "+" in step["name"] or "*" in step["name"]:
            grp_condition = convert_or_not_stmt(
                "name", step["name"].replace("+", "").replace("*", "")
            )
            join_type = "INNER" if "+" in step["name"] else "LEFT OUTER"
            join_condition = (
                f"s{se_i}.id != s{prev_se_i_group}.id AND s{se_i}.profile_id = s{prev_se_i_group}.profile_id AND s{se_i}.position > s{prev_se_i_group}.position"
                if prev_se_i_group is not None
                else f"s{se_i}.profile_id = p.id"
            )
            all_cte_clauses.append(
                f"""
            {join_type} JOIN (
                SELECT id, profile_id, position, position - CAST(DENSE_RANK() OVER(partition by profile_id ORDER BY position) AS SIGNED) AS grp
                FROM step
                WHERE {grp_condition}
            ) AS s{se_i} ON {join_condition}
            """
            )

            all_groups_select_clauses.append(
                f"s{se_i}.id as s{se_i}_id, s{se_i}.position AS s{se_i}_pos, s{se_i}.grp as s{se_i}_grp"
            )

            if "+" in step["name"]:
                all_select_clauses.append(
                    f"GROUP_CONCAT(DISTINCT s{se_i}_id) AS res_grp_concat_s{se_i}"
                )
            elif prev_se_i_group is not None:
                all_select_clauses.append(
                    f"IF(MIN(s{se_i}_pos) - MAX(s{prev_se_i_group}_pos) > 1, NULL, GROUP_CONCAT(DISTINCT s{se_i}_id)) AS grp_concat_s{se_i}"
                )

            all_groupby_clauses.append(f"s{se_i}_grp")
            prev_se_i_group = se_i
        else:
            all_groups_select_clauses.append(
                f"s{se_i}.name AS s{se_i}_name, s{se_i}.id AS s{se_i}_id, s{se_i}.position AS s{se_i}_pos"
            )
            all_select_clauses.append(f"s{se_i}_id")
            all_cte_clauses.append(
                f"\nINNER JOIN step AS s{se_i} ON p.id = s{se_i}.profile_id"
            )
            all_groupby_clauses.append(f"s{se_i}_id")

    prev_pos = -1
    prev_sql_position = -1
    for se_i, step_name in names_to_pos.items():
        step_ends_with_special = step_name.endswith(("+", "*"))
        sql_max_position = f"MAX(s{se_i}_pos)"
        if se_i == 0 and not step_name.endswith("*"):
            # pattern strict starts with step_name
            all_having_clauses.append(f"MIN(s{se_i}_pos) = 0")
        if se_i == len(flat_pattern) - 1 and not step_name.endswith("*"):
            # pattern strict ends with step_name
            all_having_clauses.append(
                f"{sql_max_position} = (SELECT max(position) FROM step AS substep WHERE substep.profile_id = profile_id)"
            )
        if not step_ends_with_special:
            all_where_clauses.append(convert_or_not_stmt(f"s{se_i}_name", step_name))
            if prev_pos > -1:
                diff = se_i - prev_pos
                all_having_clauses.append(
                    f"{sql_max_position} - {prev_sql_position} {'=' if diff == 1 else '>='} 1"
                )
        prev_pos = se_i
        prev_sql_position = sql_max_position

    query = "WITH filtered_rows AS ("
    query += "\nSELECT DISTINCT "
    query += ", ".join(all_groups_select_clauses)
    query += "\n"
    query += "\n".join(all_cte_clauses)
    query += "\n)"
    query += "\nSELECT DISTINCT "
    query += ", ".join(all_select_clauses)
    query += "\nFROM filtered_rows"

    if all_where_clauses:
        query += "\nWHERE "
        query += " AND ".join(all_where_clauses)

    query += "\nGROUP BY "
    query += ", ".join(all_groupby_clauses)
    if all_having_clauses:
        query += "\nHAVING "
        query += " AND ".join(all_having_clauses)

    return query + ";"


def convert_ppm_to_sql_query(project_id: uuid.UUID, pattern: list[dict[str, Any]]):
    print(convert_steps_to_sql_query(project_id, pattern))
    return convert_steps_to_sql_query(project_id, pattern)
