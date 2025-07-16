__TMP_ENCODING_MAPPING = {
    "Data acquisition": "a",
    "Data preparation": "b",
    "Storage": "c",
    "Feature Engineering": "d",
    "Modeling": "e",
    "Training": "f",
    "Evaluation": "g",
    "Prediction": "h",
    "Interpretation": "i",
    "Communication": "j",
    "Deployment": "k",
    "Library Loading": "l",
    "Others": "m",
}

# __TMP_ENCODING_MAPPING = {
#     "Library Loading": "a",
#     "Visualization": "b",
#     "Others": "c",
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


def format_template(
    step_name: str, algo_family: str, algo_name: str, library: str, function: str
) -> str:
    return (
        "\{\s*"
        + '"step":\s*"{step_name}",\s*"algoFamily":\s*"{algo_family}",\s*"algoName":\s*"{algo_name}",\s*"library":\s*"{library}",\s*"function":\s*"{function}"'.format(
            step_name=step_name,
            algo_family=algo_family,
            algo_name=algo_name,
            library=library,
            function=function,
        )
        + "\s*\}"
    )


def encode_step_name(step_name: str) -> str:
    return __TMP_ENCODING_MAPPING[step_name]


def encode_profile(all_steps_names: list[str]) -> str:
    return "".join(__TMP_ENCODING_MAPPING[step_name] for step_name in all_steps_names)
