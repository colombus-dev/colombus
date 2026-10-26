from pathlib import Path

notebooks_storage_path = Path("./data/notebooks")

PROFILE_FILE_EXTENSION = ".json"
NOTEBOOK_FILE_EXTENSION = ".ipynb"

REQUEST_TIMEOUT_SECONDS = 30
QUERY_TIMEOUT_SECONDS = 10


__TMP_ENCODING_MAPPING = {
    "Data Collection": "a",
    "Data Preparation": "b",
    "Data Modeling": "c",
    "Model Deployment": "g",
    "Model Evaluation": "h",
    "Save Results": "l",
}
