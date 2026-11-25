import json
import pathlib
import random

import sqlalchemy

from . import db, models, settings

PROJECT_NAME = "scale-test-v2"
NOTEBOOKS_DIR = pathlib.Path(__file__).resolve().parents[4] / "data" / "notebooks"

ALGORITHM_FAMILIES = ["preprocessing", "classification", "regression", "clustering"]
ALGORITHM_NAMES = ["StandardScaler", "RandomForest", "LogisticRegression", "KMeans"]
LIBRARIES = ["pandas", "numpy", "sklearn", "matplotlib", "seaborn"]
METRICS = ["accuracy", "f1", "rmse", "r2", "silhouette"]
ACTIONS = ["load", "clean", "transform", "train", "evaluate", "visualize"]
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
                    "metric": rng.choice(METRICS),
                    "action": rng.choice(ACTIONS),
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


def main() -> None:
    engine = sqlalchemy.create_engine(settings.get_settings().db_url_v2)
    seed(engine=engine, notebooks=load_notebooks())


if __name__ == "__main__":
    main()
