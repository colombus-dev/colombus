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
    content = StringProperty(index=True, required=True)
    position = IntegerProperty(required=True)
    # UUID used to identify a code accross different databases (e.g. neo4j and mysql)
    cross_db_uuid = StringProperty(required=True)
    nextCode = RelationshipFrom("Code", "PRECEDES")


class MetaInstruction(StructuredNode):
    algoFamily = StringProperty(index=True, required=True)
    algoName = StringProperty(index=True, required=True)
    library = StringProperty(index=True, required=True)
    function = StringProperty(index=True, required=True)
    position = IntegerProperty(required=True)
    # UUID used to identify a metainstruction accross different databases (e.g. neo4j and mysql)
    cross_db_uuid = StringProperty(required=True)
    nextMetaInstruction = RelationshipFrom("MetaInstruction", "PRECEDES")
    code = RelationshipTo("Code", "REFERS_TO")


class Step(StructuredNode):
    name = StringProperty(index=True, required=True)
    position = IntegerProperty(required=True)
    # caching the number of related metainstructions as it should not change overtime
    numberRelatedMetaInstructions = IntegerProperty(required=True)
    # UUID used to identify a step accross different databases (e.g. neo4j and mysql)
    cross_db_uuid = StringProperty(required=True)
    nextStep = RelationshipFrom("Step", "PRECEDES")
    metaInstruction = RelationshipTo("MetaInstruction", "REFERS_TO")


class Stage(StructuredNode):
    name = StringProperty(index=True, required=True)
    position = IntegerProperty(required=True)
    # caching the number of related steps as it should not change overtime
    numberRelatedSteps = IntegerProperty(required=True)
    # UUID used to identify a stage accross different databases (e.g. neo4j and mysql)
    cross_db_uuid = StringProperty(required=True)
    nextStage = RelationshipFrom("Stage", "PRECEDES")
    steps = RelationshipTo("Step", "CONTAINS")


class Profile(StructuredNode):
    name = StringProperty(unique_index=True, required=True)
    stage = RelationshipTo("Stage", "CONTAINS")


# Enabling automatic index and constraint creation
db.install_all_labels()
