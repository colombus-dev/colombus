from typing import Any, Self
from uuid import uuid4

from app.models.sql_model import (
    Profile,
    Step,
    MetaInstruction,
    Code,
)
from pydantic import BaseModel, Field, AliasChoices, AliasPath


class Code(BaseModel):
    content: str = Field(validation_alias=AliasChoices("content", "name"))


class MetaInstruction(BaseModel):
    algoName: str
    algoFamily: str
    library: str
    function: str
    code: Code = Field(validation_alias=AliasPath("tasks", 0))


class Step(BaseModel):
    meta_instructions: list[MetaInstruction] = Field(
        validation_alias=AliasChoices("meta_instructions", "tasks")
    )


class Profile(BaseModel):
    name: str
    steps: list[Step]


class ProfileFactory:

    @staticmethod
    def from_dict_list(profile_name: str, profile: list[dict[str, dict]]) -> Profile:
        all_steps = []
        for sa_i, sa in enumerate(profile):
            sa["cross_db_uuid"] = str(uuid4())
            for se_i, se in enumerate(sa["tasks"]):
                se["cross_db_uuid"] = str(uuid4())
                all_metainstructions = []
                for mi_i, mi in enumerate(se["tasks"]):
                    mi["cross_db_uuid"] = str(uuid4())
                    code = None
                    for c in mi["tasks"]:
                        c["cross_db_uuid"] = str(uuid4())
                        # TODO: manage multiple codes for same meta_intruction if possible/makes sense
                        code = Code(content=c["name"], cross_db_uuid=c["cross_db_uuid"])
                    if code:
                        session.add(code)
                    all_metainstructions.append(
                        MetaInstruction(
                            algoFamily=mi["algoFamily"],
                            algoName=mi["algoName"],
                            library=mi["library"],
                            function=mi["function"],
                            code=code,
                            cross_db_uuid=mi["cross_db_uuid"],
                        )
                    )
                all_steps.append(
                    Step(
                        name=se["name"],
                        position=se_i,
                        metaInstructions=all_metainstructions,
                        cross_db_uuid=se["cross_db_uuid"],
                    )
                )
        profile = Profile(
            name=profile_name,
            steps=all_steps,
            json_profile=profile,
        )
        return profile
