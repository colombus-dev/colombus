#!/usr/bin/env -S uv run python
import argparse
import json
import pathlib
import random
import uuid

from sqlalchemy import insert
from sqlmodel import Session, select, text

from app.models.sql_model import (
    Code,
    MetaInstruction,
    Profile,
    Project,
    Step,
    engine,
)
from app.service.project_service import delete_project_profiles
from app.utils import encode_profile

PROJECT_NAME = "scale-test"
NOTEBOOKS_DIR = (
    pathlib.Path(__file__).resolve().parent.parent.parent.parent.parent
    / "data"
    / "notebooks"
)

ALGO_FAMILIES = ["preprocessing", "classification", "regression", "clustering"]
ALGO_NAMES = ["StandardScaler", "RandomForest", "LogisticRegression", "KMeans"]
LIBRARIES = ["pandas", "numpy", "sklearn", "matplotlib", "seaborn"]
FUNCTIONS = ["read_csv", "dropna", "fillna", "groupby", "fit", "predict", "plot"]
ACTIONS = [
    "imputation",
    "data_loading",
    "row_filtering",
    "column_removal",
    "model_training",
    "prediction",
]
METRICS = ["accuracy", "f1_score", "rmse", "r2", "precision", "recall"]
MAX_ACTIONS_PER_META_INSTRUCTION = 2
MAX_METRICS_PER_META_INSTRUCTION = 2
MAX_META_INSTRUCTIONS_PER_STEP = 3


def get_or_create_project(session: Session, reset: bool) -> Project:
    project = session.exec(select(Project).where(Project.name == PROJECT_NAME)).first()
    if project is not None:
        if not reset:
            raise SystemExit(
                f"Project '{PROJECT_NAME}' already exists (id={project.id}), pass --reset"
            )
        session.execute(text("SET LOCAL statement_timeout = 0"))
        delete_project_profiles(session, project.id)
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
) -> tuple[list[dict], list[dict], list[dict], list[dict]]:
    profile_rows = []
    step_rows = []
    meta_instruction_rows = []
    code_rows = []

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
        mi_position = 0
        for position, step_name in enumerate(sequence):
            step_id = uuid.uuid4()
            mi_count = random.randint(1, MAX_META_INSTRUCTIONS_PER_STEP)
            step_rows.append(
                {
                    "id": step_id,
                    "name": step_name,
                    "position": position,
                    "number_children": mi_count,
                    "profile_id": profile_id,
                    "previous_step_id": None,
                }
            )
            for _ in range(mi_count):
                mi_id = uuid.uuid4()
                library = random.choice(LIBRARIES)
                function = random.choice(FUNCTIONS)
                meta_instruction_rows.append(
                    {
                        "id": mi_id,
                        "attributes": {
                            "algoFamily": random.choice(ALGO_FAMILIES),
                            "algoName": random.choice(ALGO_NAMES),
                            "library": library,
                            "function": function,
                            "action": random.sample(
                                ACTIONS,
                                random.randint(0, MAX_ACTIONS_PER_META_INSTRUCTION),
                            ),
                            "metrics": random.sample(
                                METRICS,
                                random.randint(0, MAX_METRICS_PER_META_INSTRUCTION),
                            ),
                        },
                        "position": mi_position,
                        "number_children": 1,
                        "profile_id": profile_id,
                        "step_id": step_id,
                    }
                )
                code_rows.append(
                    {
                        "id": uuid.uuid4(),
                        "content": f"{library}.{function}()",
                        "position": mi_position,
                        "profile_id": profile_id,
                        "meta_instruction_id": mi_id,
                    }
                )
                mi_position += 1

    return profile_rows, step_rows, meta_instruction_rows, code_rows


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
    random.seed(0)
    notebooks = load_notebooks()

    with Session(engine) as session:
        project = get_or_create_project(session, args.reset)
        project_id = project.id
        profile_rows, step_rows, meta_instruction_rows, code_rows = build_rows(
            project_id, notebooks
        )
        bulk_insert(session, Profile, profile_rows)
        bulk_insert(session, Step, step_rows)
        bulk_insert(session, MetaInstruction, meta_instruction_rows)
        bulk_insert(session, Code, code_rows)

    print(f"project_id={project_id}")
    print(
        f"notebooks={len(notebooks)} steps={len(step_rows)} "
        f"meta_instructions={len(meta_instruction_rows)} codes={len(code_rows)}"
    )


if __name__ == "__main__":
    main()
