from uuid import uuid4

from sqlalchemy import Engine
from sqlalchemy.orm import Session

from app.models.sql_model import (
    Profile,
    Stage,
    Step,
    MetaInstruction,
    Code,
)


def save_notebook_as_sql(
    notebook_name: str, profile: list[dict[str, dict]], engine: Engine
):
    with Session(engine) as session:
        all_stages = []
        for sa_i, sa in enumerate(profile):
            all_steps = []
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
            all_stages.append(
                Stage(
                    name=sa["name"],
                    position=sa_i,
                    steps=all_steps,
                    cross_db_uuid=sa["cross_db_uuid"],
                )
            )
        profile = Profile(
            name=notebook_name,
            stages=all_stages,
            json_profile=profile,
        )
        session.add(profile)
        session.commit()
