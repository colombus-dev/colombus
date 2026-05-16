import os
from pathlib import Path

origins = [
    "http://localhost",
    "http://localhost:5173",
    "http://erebe-vm9.i3s.unice.fr",
]

# TODO ymu: Replace with Pydantic config
HEADER_FIELD_X_API_KEY = "x-api-key"
GOOGLE_CLIENT_ID = os.environ["GOOGLE_CLIENT_ID"]
JWT_SECRET = os.environ["JWT_SECRET"]

notebooks_storage_path = Path("./data/notebooks")

PROFILE_FILE_EXTENSION = ".json"
NOTEBOOK_FILE_EXTENSION = ".ipynb"


__TMP_ENCODING_MAPPING = {
    "Data Acquisition": "a",
    "Data Preparation": "b",
    "Storage": "c",
    "Feature Engineering": "d",
    "Modeling": "e",
    "Training": "f",
    "Evaluation": "g",
    "Prediction": "h",
    "Interpretation": "i",
    "Communication": "j",
    "Deployment": "k",
    "Other": "l",
}

# __TMP_ENCODING_MAPPING = {
#     "Library Loading": "a",
#     "Visualization": "b",
#     "Other": "c",
#     "Data Preparation": "d",
#     "Data Profiling and Exploratory Data Analysis": "e",
#     "Data Preparation and Exploration": "f",
#     "Data Cleaning Filtering": "g",
#     "Data Sub-sampling and Train-test Splitting": "h",
#     "Data Loading": "i",
#     "Exploratory Data Analysis": "j",
#     "Feature Engineering": "k",
#     "Feature Transformation": "l",
#     "Feature Selection": "m",
#     "Model Building and Training": "n",
#     "Model Training": "o",
#     "Model Parameter Tuning": "p",
#     "Model Validation and Assembling": "q",
# }

# __TMP_ENCODING_MAPPING = {
#     "Data acquisition": "a",
#     "Data preparation": "b",
#     "Storage": "c",
#     "Feature Engineering": "d",
#     "Modeling": "e",
#     "Training": "f",
#     "Evaluation": "g",
#     "Prediction": "h",
#     "Interpretation": "i",
#     "Communication": "j",
#     "Deployment": "k",
#     "Library Loading": "l",
#     "Other": "m",
# }
