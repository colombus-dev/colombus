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
            f'{sql_step_name}.name = "{or_name}"'
            for or_name in step_name.replace("!", "").split("|")
        )
        + ")"
    )


def convert_steps_to_sql_query(pattern: list[dict[str, Any]]) -> str:
    names_to_pos = {}
    all_cte_clauses = []
    all_select_clauses = ["p.name"]
    all_groups_select_clauses = ["sub_p.id"]
    all_join_clauses = []
    all_groups_join_clauses = []
    all_where_clauses = []
    all_groups_where_clauses = []
    all_groupby_clauses = ["p.id"]
    # all_meta_instructions_where_queries = []
    # meta_instructions_prefix_query = []

    flat_pattern = flatten_pattern(pattern)

    prev_se_i_group = None
    for se_i, step in enumerate(flat_pattern):
        if step["name"] == "*":
            continue
        names_to_pos[se_i] = step["name"]

        if "+" in step["name"] or "*" in step["name"]:
            grp_condition = convert_or_not_stmt(
                "s", step["name"].replace("+", "").replace("*", "")
            )
            all_cte_clauses.append(
                f"""
                res{se_i}_groups AS (
                    SELECT subabc.profile_id, subabc.id, subabc.grp, subabc.position
                    FROM (
                        SELECT subsubabc.profile_id, subsubabc.id, subsubabc.position, subsubabc.position - CAST(DENSE_RANK() OVER(partition by profile_id ORDER BY position) AS SIGNED) AS grp
                        FROM (
                            SELECT DISTINCT p.id AS profile_id, s.id, s.position
                            FROM profile AS p
                            INNER JOIN step AS s ON p.id = s.profile_id
                            WHERE {grp_condition}
                            GROUP BY s.id
                            ORDER BY s.position
                        ) AS subsubabc
                    ) as subabc
                )
                """
            )
            all_cte_clauses.append(
                f"""
                grp_min_max_{se_i} AS (
                    SELECT profile_id, grp, MIN(position) AS min_pos, MAX(position) AS max_pos
                    FROM res{se_i}_groups
                    GROUP BY profile_id, grp
                )
                """
            )
            all_select_clauses.append(
                f"GROUP_CONCAT(DISTINCT sub_select.s{se_i}_id) AS grp_concat_s{se_i}"
            )
            all_groups_select_clauses.append(f"sub_s{se_i}.id AS s{se_i}_id")
            all_groups_select_clauses.append(
                f"sub_s{se_i}.position AS s{se_i}_position"
            )
            all_groups_select_clauses.append(f"sub_s{se_i}.grp AS s{se_i}_grp")
            all_groups_select_clauses.append(f"sub_s{se_i}.min_pos AS s{se_i}_min_pos")
            all_groups_select_clauses.append(f"sub_s{se_i}.max_pos AS s{se_i}_max_pos")
            # using JSON_ARRAYAGG over GROUP_CONCAT as it allows retuning bigger strings
            # TODO: anyway, we should optimize the query to avoid returning too long string which can lead to
            # performance/memory issues ?
            join_type = "INNER" if "+" in step["name"] else "LEFT OUTER"
            join_condition = [f"sub_p.id = sub_s{se_i}.profile_id"]
            if prev_se_i_group is not None:
                join_condition.append(
                    f"sub_s{se_i}.position > sub_s{prev_se_i_group}.max_pos"
                )
                join_condition.append(
                    f"sub_s{se_i}.min_pos <= sub_s{prev_se_i_group}.max_pos"
                )
            all_groups_join_clauses.append(
                f"""
                {join_type} JOIN (
                    SELECT res{se_i}_groups.*, grp_min_max_{se_i}.min_pos, grp_min_max_{se_i}.max_pos
                    FROM res{se_i}_groups
                    INNER JOIN grp_min_max_{se_i} ON res{se_i}_groups.grp = grp_min_max_{se_i}.grp AND res{se_i}_groups.profile_id = grp_min_max_{se_i}.profile_id
                ) AS sub_s{se_i} ON {' AND '.join(join_condition)}
            """
            )
            all_groupby_clauses.append(f"sub_select.s{se_i}_grp")
            prev_se_i_group = se_i
        else:
            all_select_clauses.append(f"s{se_i}.id")
            all_join_clauses.append(
                f"\nINNER JOIN step AS s{se_i} ON p.id = s{se_i}.profile_id"
            )
            all_groupby_clauses.append(f"s{se_i}.id")

        # TODO
        # (
        #     meta_instructions_prefix_query,
        #     meta_instructions_join_query,
        #     meta_instructions_where_query,
        # ) = convert_meta_instructions_to_sql_query(step["tasks"], se_i)
        # query += meta_instructions_join_query
        # if meta_instructions_where_query:
        #     all_meta_instructions_where_queries.append(meta_instructions_where_query)
        # if meta_instructions_prefix_query:
        #     all_meta_instructions_prefix_queries.append(meta_instructions_prefix_query)

    prev_pos = -1
    prev_sql_position = -1
    for se_i, step_name in names_to_pos.items():
        step_ends_with_special = step_name.endswith(("+", "*"))
        sql_min_position = (
            f"sub_select.s{se_i}_min_pos"
            if step_ends_with_special
            else f"s{se_i}.position"
        )
        sql_max_position = (
            f"sub_select.s{se_i}_max_pos"
            if step_ends_with_special
            else f"s{se_i}.position"
        )
        if se_i == 0 and not step_name.endswith("*"):
            # pattern strict starts with step_name
            all_where_clauses.append(f"{sql_min_position} = 0")
        if se_i == len(flat_pattern) - 1 and not step_name.endswith("*"):
            # pattern strict ends with step_name
            all_where_clauses.append(
                f"{sql_max_position} = (SELECT max(position) FROM step WHERE profile_id = p.id)"
            )
        if not step_ends_with_special:
            all_where_clauses.append(convert_or_not_stmt(f"s{se_i}", step_name))
            if prev_pos > -1:
                diff = se_i - prev_pos
                all_where_clauses.append(
                    f"{sql_max_position} - {prev_sql_position} {'=' if diff == 1 else '>='} 1"
                )
        prev_pos = se_i
        prev_sql_position = sql_max_position

    query = ""
    if all_cte_clauses:
        query += "WITH "
        query += ", ".join(all_cte_clauses)
    query += "\nSELECT DISTINCT "  # TODO: check DISTINCT
    query += ", ".join(all_select_clauses)
    query += "\nFROM profile AS p"
    query += "\n".join(all_join_clauses)
    if all_groups_join_clauses:
        query += "\nINNER JOIN (\nSELECT "
        query += ", ".join(all_groups_select_clauses)
        query += "\nFROM profile as sub_p"
        query += "\n".join(all_groups_join_clauses)
        if all_groups_where_clauses:
            query += "\nWHERE "
            query += " AND ".join(all_groups_where_clauses)
        query += "\n) AS sub_select ON p.id = sub_select.id"
    if all_where_clauses:
        query += "\nWHERE "
        query += " AND ".join(all_where_clauses)
    query += "\nGROUP BY "
    query += ", ".join(all_groupby_clauses)
    # query += "".join(all_meta_instructions_where_queries)

    # return prefix_query + "".join(meta_instructions_prefix_query) + query + ";"
    return query + ";"


def convert_ppm_to_sql_query(pattern: list[dict[str, Any]]):
    print(convert_steps_to_sql_query(pattern))
    return convert_steps_to_sql_query(pattern)
