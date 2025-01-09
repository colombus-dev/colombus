from neomodel import db

from app.models.graph_model import (
    config,
    Stage,
    Step,
    MetaInstruction,
    Code,
    Profile,
)  # TODO: execute directly instead of importing


def save_notebook_as_graph(notebook_name: str, raw_profile: list[dict[str, dict]]):
    prev_sa: Stage | None = None
    prev_se: Step | None = None
    prev_mi: MetaInstruction | None = None
    prev_code: Code | None = None
    profile = Profile(name=notebook_name).save()
    for sa in raw_profile:
        stage = Stage(name=sa["name"]).save()
        profile.stage.connect(stage)
        if prev_sa:
            stage.nextStage.connect(prev_sa)
        prev_sa = stage
        for se in sa["tasks"]:
            step = Step(name=se["name"]).save()
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
                ).save()
                step.metaInstruction.connect(meta_instruction)
                if prev_mi:
                    meta_instruction.nextMetaInstruction.connect(prev_mi)
                prev_mi = meta_instruction
                for c in mi["tasks"]:
                    code = Code(content=c["name"]).save()
                    meta_instruction.code.connect(code)
                    if prev_code:
                        code.nextCode.connect(prev_code)
                    prev_code = code
