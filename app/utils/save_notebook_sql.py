from uuid import uuid4

from sqlalchemy import Engine
from sqlalchemy.orm import Session

from app.models.sql_model import (
    Profile,
    Step,
    MetaInstruction,
    Code,
)


def save_notebook_as_sql(
    profile_name: str, json_profile: list[dict[str, dict]], engine: Engine
):
    with Session(engine) as session:
        all_steps = []
        all_profile_metainstructions = []
        all_profile_codes = []
        total_se_i = 0
        total_mi_i = 0
        total_c_i = 0
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
                all_steps.append(
                    Step(
                        name=se["name"],
                        position=total_se_i,
                        meta_instructions=all_metainstructions,
                        number_children=len(se["tasks"]),
                    )
                )
                all_profile_metainstructions.extend(all_metainstructions)
                total_se_i += 1
        profile = Profile(
            name=profile_name,
            steps=all_steps,
            meta_instructions=all_profile_metainstructions,
            codes=all_profile_codes,
            json_profile=json_profile,
        )
        session.add(profile)
        session.commit()
