from neomodel import db

from app.models.graph_model import (
    config,
    Stage,
    Step,
    MetaInstruction,
    Code,
    Profile,
)


def save_notebook_as_graph(notebook_name: str, raw_profile: list[dict[str, dict]]):
    prev_sa: Stage | None = None
    prev_se: Step | None = None
    prev_mi: MetaInstruction | None = None
    prev_code: Code | None = None
    profile = Profile(name=notebook_name).save()
    for sa in raw_profile:
        stage = Stage(name=sa["name"], cross_db_uuid=sa["cross_db_uuid"]).save()
        profile.stage.connect(stage)
        if prev_sa:
            stage.nextStage.connect(prev_sa)
        prev_sa = stage
        for se in sa["tasks"]:
            step = Step(name=se["name"], cross_db_uuid=se["cross_db_uuid"]).save()
            stage.steps.connect(step)
            if prev_se:
                step.nextStep.connect(prev_se)
            prev_se = step
            for mi in se["tasks"]:
                meta_instruction = MetaInstruction(
                    algoFamily=mi["algoFamily"],
                    algoName=mi["algoName"],
                    library=mi["library"],
                    function=mi["function"],
                    cross_db_uuid=mi["cross_db_uuid"],
                ).save()
                step.metaInstruction.connect(meta_instruction)
                if prev_mi:
                    meta_instruction.nextMetaInstruction.connect(prev_mi)
                prev_mi = meta_instruction
                for c in mi["tasks"]:
                    code = Code(
                        content=c["name"], cross_db_uuid=c["cross_db_uuid"]
                    ).save()
                    meta_instruction.code.connect(code)
                    if prev_code:
                        code.nextCode.connect(prev_code)
                    prev_code = code
