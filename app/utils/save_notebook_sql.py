from sqlalchemy import Engine
from sqlalchemy.orm import Session

from app.models.model import (
    Workflow,
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
            for se_i, se in enumerate(sa["tasks"]):
                all_metainstructions = []
                for mi_i, mi in enumerate(se["tasks"]):
                    code = None
                    for c in mi["tasks"]:
                        # TODO: manage multiple codes for same meta_intruction if possible/makes sense
                        code = Code(content=c["name"])
                    if code:
                        session.add(code)
                    all_metainstructions.append(
                        MetaInstruction(
                            algoFamily=mi["algoFamily"],
                            algoName=mi["algoName"],
                            library=mi["library"],
                            function=mi["function"],
                            code=code,
                        )
                    )
                all_steps.append(
                    Step(
                        name=se["name"],
                        position=se_i,
                        metaInstructions=all_metainstructions,
                    )
                )
            all_stages.append(Stage(name=sa["name"], position=sa_i, steps=all_steps))
        workflow = Workflow(name=notebook_name, stages=all_stages)
        session.add(workflow)
        session.commit()
