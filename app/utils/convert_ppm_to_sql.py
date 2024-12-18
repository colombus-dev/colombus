from typing import Any


def convert_meta_instructions_to_sql_query(
    meta_instructions: list[dict[str, Any]], stage_pos: int, step_pos: int
) -> tuple[str, str]:
    names_to_pos = {}
    join_query = ""
    where_query = ""
    for mi_i, mi in enumerate(meta_instructions):
        if mi == "*":
            continue
        names_to_pos[mi_i] = mi

        join_query += f"\nINNER JOIN meta_instruction AS mi{stage_pos}_{step_pos}_{mi_i} ON se{stage_pos}_{step_pos}.id = mi{stage_pos}_{step_pos}_{mi_i}.step_id"

    prev_pos = -1
    for mi_i, mi in names_to_pos.items():
        for k, v in mi.items():
            if k != "tasks" and v != "*":
                where_query += f' AND mi{stage_pos}_{step_pos}_{mi_i}.{k} = "{v}"'
        if prev_pos > -1:
            diff = mi_i - prev_pos
            where_query += f" AND mi{stage_pos}_{step_pos}_{mi_i}.position - mi{stage_pos}_{step_pos}_{prev_pos}.position {'=' if diff == 1 else '>='} 1"
        prev_pos = mi_i
        if mi_i < len(meta_instructions) - 1:
            where_query += " AND"

    return join_query, where_query


def convert_steps_to_sql_query(
    steps: list[dict[str, Any]], stage_pos: int
) -> tuple[str, str]:
    names_to_pos = {}
    all_meta_instructions_where_queries = []
    join_query = ""
    where_query = ""
    for se_i, step in enumerate(steps):
        if step == "*":
            continue
        names_to_pos[se_i] = step["name"]

        join_query += f"\nINNER JOIN step AS se{stage_pos}_{se_i} ON s{stage_pos}.id = se{stage_pos}_{se_i}.stage_id"
        meta_instructions_join_query, meta_instructions_where_query = (
            convert_meta_instructions_to_sql_query(step["tasks"], stage_pos, se_i)
        )
        join_query += meta_instructions_join_query
        if meta_instructions_where_query:
            all_meta_instructions_where_queries.append(meta_instructions_where_query)

    prev_pos = -1
    for se_i, step_name in names_to_pos.items():
        where_query += f' AND se{stage_pos}_{se_i}.name = "{step_name}"'
        if prev_pos > -1:
            diff = se_i - prev_pos
            where_query += f" AND se{stage_pos}_{se_i}.position - se{stage_pos}_{prev_pos}.position {'=' if diff == 1 else '>='} 1"
        prev_pos = se_i
        if se_i < len(steps) - 1:
            where_query += " AND"

    where_query += "".join(all_meta_instructions_where_queries)

    return join_query, where_query


def convert_stages_to_sql_query(pattern: list[str | dict[str, Any]]) -> str:
    names_to_pos = {}
    query = "SELECT DISTINCT w.name from workflow AS w"
    all_steps_where_queries = []

    for sa_i, stage in enumerate(pattern):
        if stage == "*":
            continue
        names_to_pos[sa_i] = stage["name"]

        query += f"\nINNER JOIN stage AS s{sa_i} ON w.id = s{sa_i}.workflow_id"
        steps_join_query, steps_where_query = convert_steps_to_sql_query(
            stage["tasks"], sa_i
        )
        query += steps_join_query
        if steps_where_query:
            all_steps_where_queries.append(steps_where_query)

    query += "\nWHERE"
    prev_pos = -1
    for sa_i, stage_name in names_to_pos.items():
        query += f' s{sa_i}.name = "{stage_name}"'
        if prev_pos > -1:
            diff = sa_i - prev_pos
            query += f" AND s{sa_i}.position - s{prev_pos}.position {'=' if diff == 1 else '>='} 1"
        prev_pos = sa_i
        if sa_i < len(pattern) - 1:
            query += " AND"

    query += "".join(all_steps_where_queries)

    return query + ";"


def convert_ppm_to_sql_query(pattern: list[str | dict[str, Any]]):
    return convert_stages_to_sql_query(pattern)


"""
SELECT DISTINCT workflow.name
FROM workflow
INNER JOIN stage AS s0 ON workflow.id = s0.workflow_id
INNER JOIN stage AS s1 ON workflow.id = s1.workflow_id
WHERE s0.name = "Library Loading" AND s1.name = "Data Preparation" AND s0.position < s1.position
"""
