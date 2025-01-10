import os

from neomodel import (
    db,
    config,
    StructuredNode,
    StringProperty,
    IntegerProperty,
    UniqueIdProperty,
    RelationshipTo,
    RelationshipFrom,
)

config.DATABASE_URL = os.getenv("NEO4J_BOLT_FULL_URL")


class Code(StructuredNode):
    content = StringProperty(index=True, required=True)  # TODO: rename name field
    nextCode = RelationshipFrom("Code", "PRECEDES")
    position = IntegerProperty(required=True)
    cross_db_uuid = StringProperty(required=True)


class MetaInstruction(StructuredNode):
    algoFamily = StringProperty(index=True, required=True)
    algoName = StringProperty(index=True, required=True)
    library = StringProperty(index=True, required=True)
    function = StringProperty(index=True, required=True)
    nextMetaInstruction = RelationshipFrom("MetaInstruction", "PRECEDES")
    code = RelationshipTo("Code", "REFERS_TO")
    position = IntegerProperty(required=True)
    cross_db_uuid = StringProperty(required=True)


class Step(StructuredNode):
    name = StringProperty(index=True, required=True)
    nextStep = RelationshipFrom("Step", "PRECEDES")
    metaInstruction = RelationshipTo("MetaInstruction", "REFERS_TO")
    position = IntegerProperty(required=True)
    cross_db_uuid = StringProperty(required=True)


class Stage(StructuredNode):
    name = StringProperty(index=True, required=True)
    nextStage = RelationshipFrom("Stage", "PRECEDES")
    steps = RelationshipTo("Step", "CONTAINS")
    position = IntegerProperty(required=True)
    cross_db_uuid = StringProperty(required=True)


class Profile(StructuredNode):
    name = StringProperty(unique_index=True, required=True)
    stage = RelationshipTo("Stage", "CONTAINS")


# Enabling automatic index and constraint creation
db.install_all_labels()
