import uuid

from sqlmodel import Session, text

from app.models.api_model import PatternGroup


def profile_steps(
    session: Session, profile_id: str
) -> dict[int, tuple[uuid.UUID, str]]:
    rows = session.execute(
        text("SELECT position, id, name FROM step WHERE profile_id = :profile_id"),
        {"profile_id": profile_id},
    ).all()
    return {row[0]: (row[1], row[2]) for row in rows}


def group_matches_step(group: PatternGroup, name: str) -> bool:
    matched = name in group.steps
    return not matched if group.metaCharacters.negate else matched
