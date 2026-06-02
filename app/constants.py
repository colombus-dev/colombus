from pathlib import Path

notebooks_storage_path = Path("./data/notebooks")

PROFILE_FILE_EXTENSION = ".json"
NOTEBOOK_FILE_EXTENSION = ".ipynb"


__TMP_ENCODING_MAPPING = {
    "Data Collection": "a",
    "Data Preparation": "b",
    "Data Modeling": "c",
    "Model Deployment": "g",
    "Model Evaluation": "h",
    "Save Results": "l",
}
