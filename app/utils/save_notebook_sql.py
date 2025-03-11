from uuid import uuid4, UUID

from sqlalchemy import Engine
from sqlalchemy.orm import Session

from app.models.sql_model import (
    Profile,
    Step,
    MetaInstruction,
    Code,
)
from app.utils import encode_profile


def save_notebook_as_sql(
    project_id: UUID,
    profile_name: str,
    json_profile: list[dict[str, dict]],
    engine: Engine,
):
    with Session(engine) as session:
        all_steps: list[Step] = []
        all_profile_metainstructions: list[MetaInstruction] = []
        all_profile_codes: list[Code] = []
        total_se_i = 0
        total_mi_i = 0
        total_c_i = 0
        previous_step = None
        for sa in json_profile:
            for se in sa["tasks"]:
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
                new_step = Step(
                    name=se["name"],
                    position=total_se_i,
                    meta_instructions=all_metainstructions,
                    number_children=len(se["tasks"]),
                    previous_step=previous_step,
                )
                all_steps.append(new_step)
                previous_step = new_step
                all_profile_metainstructions.extend(all_metainstructions)
                total_se_i += 1
        profile = Profile(
            project_id=project_id,
            name=profile_name,
            steps=all_steps,
            encoded_profile=encode_profile([step.name for step in all_steps]),
            meta_instructions=all_profile_metainstructions,
            codes=all_profile_codes,
            json_profile=json_profile,
        )
        session.add(profile)
        session.commit()
