import uuid

from sqlalchemy import bindparam
from sqlmodel import Session, text

from app.models.api_model import PatternMetaInstruction

_FIELDS = ("algoFamily", "algoName", "library", "function")


def dedupe_meta_instructions(
    meta_instructions: list[PatternMetaInstruction],
) -> list[PatternMetaInstruction]:
    deduped: dict[str, PatternMetaInstruction] = {}
    for mi in meta_instructions:
        fields = {field: getattr(mi, field) for field in _FIELDS}
        if any(fields.values()):
            deduped[str(fields)] = mi
    return list(deduped.values())


def _build_resolution_query(
    meta_instructions: list[PatternMetaInstruction],
) -> tuple[str, dict[str, str]]:
    select_cols = ["s.id::text AS step_id"]
    joins = []
    params: dict[str, str] = {}
    prev_alias = None

    for i, mi in enumerate(meta_instructions):
        mi_alias = f"mi_{i}"
        code_alias = f"code_{i}"
        select_cols.append(f"{mi_alias}.id::text AS {mi_alias}_id")
        select_cols.append(f"{code_alias}.id::text AS {code_alias}_id")

        conditions = [
            f"{mi_alias}.step_id = s.id",
            f"{mi_alias}.profile_id = s.profile_id",
        ]
        for field in _FIELDS:
            value = getattr(mi, field)
            if value is None:
                continue
            param_name = f"{mi_alias}_{field}"
            conditions.append(f'{mi_alias}."{field}" = :{param_name}')
            params[param_name] = value
        if prev_alias is not None:
            conditions.append(f"{mi_alias}.position > {prev_alias}.position")

        joins.append(
            f"INNER JOIN metainstruction AS {mi_alias} ON " + " AND ".join(conditions)
        )
        joins.append(
            f"INNER JOIN code AS {code_alias} "
            f"ON {code_alias}.meta_instruction_id = {mi_alias}.id"
        )
        prev_alias = mi_alias

    query = (
        "SELECT " + ", ".join(select_cols) + "\n"
        "FROM step AS s\n" + "\n".join(joins) + "\n"
        "WHERE s.id IN :step_ids"
    )
    return query, params


def resolve_group_meta_instructions(
    session: Session,
    step_ids: list[uuid.UUID],
    meta_instructions: list[PatternMetaInstruction],
) -> list[uuid.UUID] | None:
    deduped = dedupe_meta_instructions(meta_instructions)
    if not deduped:
        return list(dict.fromkeys(step_ids))
    if not step_ids:
        return []

    query, params = _build_resolution_query(deduped)
    rows = session.execute(
        text(query).bindparams(bindparam("step_ids", expanding=True)),
        {**params, "step_ids": step_ids},
    ).all()

    # The group matches if one of its steps has every meta instruction of the group, in order.
    if not rows:
        return None

    resolved = list(dict.fromkeys(row.step_id for row in rows))
    for i in range(len(deduped)):
        resolved.extend(dict.fromkeys(getattr(row, f"mi_{i}_id") for row in rows))
        resolved.extend(dict.fromkeys(getattr(row, f"code_{i}_id") for row in rows))
    return resolved
