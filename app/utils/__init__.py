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


def encode_step_name(step_name: str):
    return __TMP_ENCODING_MAPPING[step_name]


def encode_profile(all_steps_names: list[str]):
    return "".join(__TMP_ENCODING_MAPPING[step_name] for step_name in all_steps_names)
