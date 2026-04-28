from uuid import UUID

from sqlalchemy.orm import Session

from app.constants import __TMP_ENCODING_MAPPING
from app.models.api_model import Profile as JsonProfile
from app.models.sql_model import (
    CellOutput,
    Code,
    MetaInstruction,
    Profile,
    Step,
)
from app.utils import encode_profile


def is_steps_taxonomy_supported(json_profile: JsonProfile):
    return all(step["name"] in __TMP_ENCODING_MAPPING for step in json_profile.source)


def save_notebook_as_sql(
    project_id: UUID,
    json_profile: JsonProfile,
    session: Session,
    commit: bool = True,
):
    all_steps: list[Step] = []
    all_profile_metainstructions: list[MetaInstruction] = []
    all_profile_codes: list[Code] = []
    previous_step = None
    total_mi_i = 0
    total_c_i = 0
    for se_i, se in enumerate(json_profile.source):
        all_metainstructions = []
        for mi in se["tasks"]:
            all_codes = []
            for c in mi["tasks"]:
                all_codes.append(Code(content=c["name"], position=total_c_i))
                total_c_i += 1
            if isinstance(mi["algoFamily"], list):
                mi["algoFamily"] = ", ".join(mi["algoFamily"])
            if isinstance(mi["algoName"], list):
                mi["algoName"] = ", ".join(mi["algoName"])
            if isinstance(mi["library"], list):
                mi["library"] = ", ".join(mi["library"])
            if isinstance(mi["function"], list):
                mi["function"] = ", ".join(mi["function"])
            all_metainstructions.append(
                MetaInstruction(
                    algoFamily=mi["algoFamily"],
                    algoName=mi["algoName"],
                    library=mi["library"],
                    function=mi["function"],
                    position=total_mi_i,
                    codes=all_codes,
                    number_children=len(mi["tasks"]),
                )
            )
            all_profile_codes.extend(all_codes)
            total_mi_i += 1

        cell_outputs = [
            CellOutput(image=json_profile.outputs[output_id])
            for output_id in se["outputs_ids"]
        ]
        new_step = Step(
            name=se["name"],
            position=se_i,
            meta_instructions=all_metainstructions,
            number_children=len(se["tasks"]),
            previous_step=previous_step,
            cell_outputs=cell_outputs,
        )
        all_steps.append(new_step)
        previous_step = new_step
        all_profile_metainstructions.extend(all_metainstructions)
    profile = Profile(
        project_id=project_id,
        name=json_profile.name,
        steps=all_steps,
        encoded_profile=encode_profile([step.name for step in all_steps]),
        meta_instructions=all_profile_metainstructions,
        codes=all_profile_codes,
        json_profile=json_profile.model_dump_json(),
    )
    session.add(profile)
    if commit:
        session.commit()
