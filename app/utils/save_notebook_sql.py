from sqlalchemy.orm import Session

from app.constants import __TMP_ENCODING_MAPPING
from app.models.api_model import Profile as JsonProfile
from app.models.sql_model import Code, MetaInstruction, Profile


def is_steps_taxonomy_supported(json_profile: JsonProfile):
    return all(step["name"] in __TMP_ENCODING_MAPPING for step in json_profile.source)


def blank_to_none(value: str | None) -> str | None:
    return None if value == "" else value


def save_notebook_as_sql(
    project_id: int,
    json_profile: JsonProfile,
    session: Session,
    commit: bool = True,
):
    profile = Profile(
        project_id=project_id, name=json_profile.name, score=json_profile.score
    )
    for step in json_profile.source:
        tasks = step.get("tasks", [])
        for task in tasks if len(tasks) > 0 else [{}]:
            attributes = task.get("attributes", task)
            instruction = MetaInstruction(
                project_id=project_id,
                step=step["name"],
                library=blank_to_none(attributes.get("library")),
                function=blank_to_none(attributes.get("function")),
                algorithm_family=blank_to_none(attributes.get("algoFamily")),
                algorithm_name=blank_to_none(attributes.get("algoName")),
                metric=blank_to_none(attributes.get("metric")),
                action=blank_to_none(attributes.get("action")),
            )
            instruction.codes.extend(
                Code(content=code["name"]) for code in task.get("tasks", [])
            )
            profile.meta_instructions.append(instruction)
    session.add(profile)
    if commit:
        session.commit()
