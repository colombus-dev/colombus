#!/usr/bin/env -S uv run python
import argparse
import json
import pathlib
import uuid

from sqlalchemy import delete, insert
from sqlmodel import Session, col, select, text

from app.models.sql_model import Profile, Project, Step, engine
from app.utils import encode_profile

PROJECT_NAME = "scale-test"
NOTEBOOKS_DIR = (
    pathlib.Path(__file__).resolve().parent.parent.parent.parent.parent
    / "data"
    / "notebooks"
)
PPM_FUNCTION_SQL_PATH = (
    pathlib.Path(__file__).resolve().parent.parent.parent / "ppm_to_regex_function.sql"
)


def ensure_ppm_to_regex_installed(session: Session) -> None:
    try:
        session.execute(text("CREATE EXTENSION IF NOT EXISTS plpython3u"))
        session.commit()
    except Exception:
        session.rollback()

    statements = [s.strip() for s in PPM_FUNCTION_SQL_PATH.read_text().split(";")]
    for statement in statements:
        if statement:
            session.execute(text(statement))
    session.commit()


def get_or_create_project(session: Session, reset: bool) -> Project:
    project = session.exec(select(Project).where(Project.name == PROJECT_NAME)).first()
    if project is not None:
        if not reset:
            raise SystemExit(
                f"Project '{PROJECT_NAME}' already exists (id={project.id}), pass --reset"
            )
        profile_ids = session.exec(
            select(Profile.id).where(Profile.project_id == project.id)
        ).all()
        if profile_ids:
            session.execute(delete(Step).where(col(Step.profile_id).in_(profile_ids)))
            session.execute(
                delete(Profile).where(col(Profile.project_id) == project.id)
            )
            session.commit()
        return project

    project = Project(name=PROJECT_NAME)
    session.add(project)
    session.commit()
    session.refresh(project)
    return project


def load_notebooks() -> dict[str, list[str]]:
    notebooks = {}
    for path in sorted(NOTEBOOKS_DIR.glob("*.json")):
        data = json.loads(path.read_text())
        notebooks[data["name"]] = [step["name"] for step in data["source"]]
    return notebooks


def build_rows(
    project_id: uuid.UUID, notebooks: dict[str, list[str]]
) -> tuple[list[dict], list[dict]]:
    profile_rows = []
    step_rows = []

    for name, sequence in notebooks.items():
        profile_id = uuid.uuid4()
        profile_rows.append(
            {
                "id": profile_id,
                "project_id": project_id,
                "name": name,
                "json_profile": {
                    "name": name,
                    "source": [{"name": s} for s in sequence],
                },
                "encoded_profile": encode_profile(sequence),
            }
        )
        for position, step_name in enumerate(sequence):
            step_rows.append(
                {
                    "id": uuid.uuid4(),
                    "name": step_name,
                    "position": position,
                    "number_children": 0,
                    "profile_id": profile_id,
                    "previous_step_id": None,
                }
            )

    return profile_rows, step_rows


def bulk_insert(
    session: Session, model: type, rows: list[dict], chunk_size: int = 5000
) -> None:
    for start in range(0, len(rows), chunk_size):
        session.execute(insert(model), rows[start : start + chunk_size])
    session.commit()


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--reset", action="store_true")
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> None:
    args = parse_args(argv)
    notebooks = load_notebooks()

    with Session(engine) as session:
        ensure_ppm_to_regex_installed(session)
        project = get_or_create_project(session, args.reset)
        project_id = project.id
        profile_rows, step_rows = build_rows(project_id, notebooks)
        bulk_insert(session, Profile, profile_rows)
        bulk_insert(session, Step, step_rows)

    print(f"project_id={project_id}")
    print(f"notebooks={len(notebooks)} steps={len(step_rows)}")


if __name__ == "__main__":
    main()
