from neomodel import (
    config,
    StructuredNode,
    StringProperty,
    IntegerProperty,
    UniqueIdProperty,
    RelationshipTo,
    RelationshipFrom,
)

config.DATABASE_URL = "bolt://neo4j:pinta_nina@colombus_neo4j:7687"


class Code(StructuredNode):
    uid = UniqueIdProperty()
    content = StringProperty(index=True, required=True)  # TODO: rename name field
    nextCode = RelationshipFrom("Code", "PRECEDES")


class MetaInstruction(StructuredNode):
    uid = UniqueIdProperty()
    algoFamily = StringProperty(index=True, required=True)
    algoName = StringProperty(index=True, required=True)
    library = StringProperty(index=True, required=True)
    function = StringProperty(index=True, required=True)
    nextMetaInstruction = RelationshipFrom("MetaInstruction", "PRECEDES")
    code = RelationshipTo("Code", "REFERS_TO")


class Step(StructuredNode):
    name = StringProperty(index=True, required=True)
    nextStep = RelationshipFrom("Step", "PRECEDES")
    metaInstruction = RelationshipTo("MetaInstruction", "REFERS_TO")


class Stage(StructuredNode):
    name = StringProperty(index=True, required=True)
    nextStage = RelationshipFrom("Stage", "PRECEDES")
    steps = RelationshipTo("Step", "CONTAINS")


class Workflow(StructuredNode):
    name = StringProperty(unique_index=True, required=True)
    stage = RelationshipTo("Stage", "CONTAINS")
