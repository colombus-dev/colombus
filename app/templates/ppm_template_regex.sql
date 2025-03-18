WITH filtered_profiles AS (
    SELECT "id",
        "name",
        "encoded_profile"
        FROM profile
    WHERE "project_id" = '{{ project_id }}'
), regex_steps_pattern_matching AS (
    SELECT fp.*, ppm_to_regex('{{ regex_text }}', fp."encoded_profile") AS matching_groups
    FROM filtered_profiles AS fp
)
SELECT p."name"
{% for group in all_groups %}
    , array_agg(DISTINCT s{{ loop.index0 }}.id::text)
    {% set grouploop = loop %}
    {% for mi in group.meta_instructions %}
        || array_agg(mi_{{ grouploop.index0 }}_{{ loop.index0 }}.id::text) || array_agg(code_{{ grouploop.index0 }}_{{ loop.index0 }}.id::text)
    {%- endfor %} AS res_{{ loop.index0 }}
{%- endfor %}
FROM filtered_profiles AS p
    {% for group in all_groups -%}
        {% set grouploop = loop %}
        {%- if group.is_required -%}
            INNER JOIN
        {%- else -%}
            LEFT OUTER JOIN
        {%- endif -%} (
            SELECT s.id,
                s.profile_id,
                {{ loop.index }} AS grp_id,
                (sub_grp."matching_groups").match_id
            FROM step AS s
                INNER JOIN regex_steps_pattern_matching AS sub_grp ON s."profile_id" = (sub_grp."id")
                    AND (sub_grp."matching_groups").grp_id = {{ loop.index }}
                    AND s."position" >= (sub_grp."matching_groups").grp_start
                    AND s."position" < (sub_grp."matching_groups").grp_end
            ) AS s{{ loop.index0 }} ON p."id" = s{{ loop.index0 }}."profile_id" {%- if loop.index0 > 0 -%}AND s0."match_id" = s{{ loop.index0 }}."match_id"{%- endif -%}
        {% set prev_mi_i = None %}
        {% for mi in group.meta_instructions %}
            INNER JOIN metainstruction AS mi_{{ grouploop.index0 }}_{{ loop.index0 }} ON mi_{{ grouploop.index0 }}_{{ loop.index0 }}."profile_id" = s{{ grouploop.index0 }}."profile_id"
                AND mi_{{ grouploop.index0 }}_{{ loop.index0 }}."step_id" = s{{ grouploop.index0 }}."id"
                {% if mi.algoFamily %}
                    AND mi_{{ grouploop.index0 }}_{{ loop.index0 }}."algoFamily" = '{{ mi.algoFamily }}'
                {% endif %}
                {% if mi.algoName %}
                    AND mi_{{ grouploop.index0 }}_{{ loop.index0 }}."algoName" = '{{ mi.algoName }}'
                {% endif %}
                {% if mi.library %}
                    AND mi_{{ grouploop.index0 }}_{{ loop.index0 }}."library" = '{{ mi.library }}'
                {% endif %}
                {% if mi.function %}
                    AND mi_{{ grouploop.index0 }}_{{ loop.index0 }}."function" = '{{ mi.function }}'
                {% endif %}
                {% if prev_mi_i != None %}
                    AND mi_{{ grouploop.index0 }}_{{ loop.index0 }}."position" > mi_{{ grouploop.index0 }}_{{ prev_mi_i }}."position"
                {% endif %}
                {% set prev_mi_i = loop.index0 %}
            INNER JOIN code AS code_{{ grouploop.index0 }}_{{ loop.index0 }} ON code_{{ grouploop.index0 }}_{{ loop.index0 }}."profile_id" = s{{ grouploop.index0 }}."profile_id"
                AND code_{{ grouploop.index0 }}_{{ loop.index0 }}."meta_instruction_id" = mi_{{ grouploop.index0 }}_{{ loop.index0 }}."id"
        {%- endfor %}
    {%- endfor %}
GROUP BY p."name"
{% for i in range(all_groups|count) %}
    , s{{ i }}.grp_id, s{{ i }}.match_id
{%- endfor -%};
