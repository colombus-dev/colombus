from pathlib import Path


API_KEY = "COL-0659-PROF"

notebooks_storage_path = Path("./data/notebooks")

__TMP_ENCODING_MAPPING = {
    "Library Loading": "a",
    "Visualization": "b",
    "Others": "c",
    "Data Preparation": "d",
    "Data Profiling and Exploratory Data Analysis": "e",
    "Data Preparation and Exploration": "f",
    "Data Cleaning Filtering": "g",
    "Data Sub-sampling and Train-test Splitting": "h",
    "Data Loading": "i",
    "Exploratory Data Analysis": "j",
    "Feature Engineering": "k",
    "Feature Transformation": "l",
    "Feature Selection": "m",
    "Model Building and Training": "n",
    "Model Training": "o",
    "Model Parameter Tuning": "p",
    "Model Validation and Assembling": "q",
}

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
#     "Others": "m",
# }