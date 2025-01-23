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

        prefix_query += f", mi{step_pos}_{mi_i}.cross_db_uuid"
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


def convert_steps_to_sql_query(pattern: list[str | dict[str, Any]]) -> str:
    names_to_pos = {}
    prefix_query = "SELECT DISTINCT p.name"
    query = " from profile AS p"
    all_meta_instructions_where_queries = []
    meta_instructions_prefix_query = []

    for se_i, step in enumerate(pattern):
        if step == "*":
            continue
        names_to_pos[se_i] = step["name"]

        prefix_query += f", s{se_i}.cross_db_uuid"
        query += f"\nINNER JOIN step AS s{se_i} ON p.id = s{se_i}.profile_id"

        (
            meta_instructions_prefix_query,
            meta_instructions_join_query,
            meta_instructions_where_query,
        ) = convert_meta_instructions_to_sql_query(step["tasks"], se_i)
        query += meta_instructions_join_query
        if meta_instructions_where_query:
            all_meta_instructions_where_queries.append(meta_instructions_where_query)
        if meta_instructions_prefix_query:
            all_meta_instructions_prefix_queries.append(meta_instructions_prefix_query)

    query += "\nWHERE "
    prev_pos = -1
    all_where_clauses = []
    for se_i, step_name in names_to_pos.items():
        if se_i == 0:
            # pattern strict starts with step_name
            all_where_clauses.append(f"s{se_i}.position = 0")
        if se_i == len(pattern) - 1:
            # pattern strict ends with step_name
            all_where_clauses.append(
                f"s{se_i}.position = (SELECT max(position) FROM step WHERE profile_id = p.id)"
            )
        all_where_clauses.append(f's{se_i}.name = "{step_name}"')
        if prev_pos > -1:
            diff = se_i - prev_pos
            all_where_clauses.append(
                f"s{se_i}.position - s{prev_pos}.position {'=' if diff == 1 else '>='} 1"
            )
        prev_pos = se_i

    query += " AND ".join(all_where_clauses)

    query += "".join(all_meta_instructions_where_queries)

    return prefix_query + "".join(meta_instructions_prefix_query) + query + ";"


def convert_ppm_to_sql_query(pattern: list[str | dict[str, Any]]):
    print(convert_steps_to_sql_query(pattern))
    return convert_steps_to_sql_query(pattern)
