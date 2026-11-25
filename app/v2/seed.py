import json
import pathlib
import random

import sqlalchemy
import typer

from . import db, models

PROJECT_NAME = "scale-test-v2"
NOTEBOOKS_DIR = pathlib.Path(__file__).resolve().parents[4] / "data" / "notebooks"

ALGORITHM_FAMILIES = ["preprocessing", "classification", "regression", "clustering"]
ALGORITHM_NAMES = ["StandardScaler", "RandomForest", "LogisticRegression", "KMeans"]
LIBRARIES = ["pandas", "numpy", "sklearn", "matplotlib", "seaborn"]
FUNCTIONS = ["read_csv", "dropna", "fillna", "groupby", "fit", "predict", "plot"]


def load_notebooks() -> dict[str, list[str]]:
    notebooks = {}
    for path in sorted(NOTEBOOKS_DIR.glob("*.json")):
        data = json.loads(path.read_text())
        notebooks[data["name"]] = [step["name"] for step in data["source"]]
    return notebooks


def seed(engine, notebooks: dict[str, list[str]], random_seed: int = 0) -> None:
    rng = random.Random(random_seed)
    db.create_database(engine.url)
    with db.session_scope(engine) as session:
        db.reset_tables(session)
        project = db.add(session, models.Project(name=PROJECT_NAME))
        for name, steps in notebooks.items():
            profile = db.add(
                session,
                models.Profile(project_id=project.id, name=name),
            )
            rows = [
                {
                    "project_id": project.id,
                    "profile_id": profile.id,
                    "step": step,
                    "library": rng.choice(LIBRARIES),
                    "function": rng.choice(FUNCTIONS),
                    "algorithm_family": rng.choice(ALGORITHM_FAMILIES),
                    "algorithm_name": rng.choice(ALGORITHM_NAMES),
                }
                for step in steps
            ]
            ids = db.bulk_insert(session, models.MetaInstruction, rows)
            codes = [
                {
                    "meta_instruction_id": id_,
                    "content": f"{row['library']}.{row['function']}()",
                }
                for id_, row in zip(ids, rows, strict=True)
            ]
            db.bulk_insert(session, models.Code, codes)


def main(database_url: str = typer.Option(..., envvar="DATABASE_URL")) -> None:
    engine = sqlalchemy.create_engine(database_url)
    notebooks = load_notebooks()
    seed(engine=engine, notebooks=notebooks)


if __name__ == "__main__":
    typer.run(main)
