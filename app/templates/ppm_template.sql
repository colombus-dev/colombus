WITH filtered_rows AS (
    SELECT p.id as profile_id, p.name{% if all_groups_select_clauses %}, {{ all_groups_select_clauses|join(', ') }}{% endif %}
    {{ all_cte_clauses|join('\n') }}
)
SELECT DISTINCT name{% if all_select_clauses %}, {{ all_select_clauses|join(', ') }}{% endif %}
FROM filtered_rows
GROUP BY profile_id, name{% if all_groupby_clauses %}, {{ all_groupby_clauses|join(', ') }}{% endif %}
{% if all_having_clauses %}HAVING {{ all_having_clauses|join(' AND ') }}{% endif %};
