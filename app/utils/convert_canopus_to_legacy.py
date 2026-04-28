from canopus_dsl import Pattern as CanopusPattern, AlternativeExpr, ElementExpr, Expr
from app.models.api_model import (
    Pattern,
    PatternGroup,
    PatternMetaCharacters,
    PatternMetaInstruction,
)


def convert_pattern_to_legacy(
    preceding_patterns: list[CanopusPattern],
    last_pattern: CanopusPattern,
    imported_patterns: list[Pattern],
) -> Pattern:
    # TODO: replace with visitor
    imported_patterns_dict = {pattern.name: pattern for pattern in imported_patterns}
    colombus_pattern = Pattern(name=last_pattern.name, groups=[])
    if colombus_pattern.groups is None:
        colombus_pattern.groups = []
    strict_start = False
    for i, group in enumerate(last_pattern.sequence):
        if "name" in dir(group):
            if group.name == "#start":
                strict_start = True
                continue
            elif group.name == "#end":
                colombus_pattern.groups[-1].metaCharacters.endsWith = True
            elif group.name == "*":
                colombus_pattern.groups.append(
                    PatternGroup(
                        name=f"group_{i}",
                        steps=[],
                        multiplicity="*",
                        metaInstructions=[],  # TODO
                        metaCharacters=PatternMetaCharacters(
                            startsWith=False,
                            endsWith=False,
                            negate=False,
                        ),
                    )
                )
            else:
                retrieved_pattern = imported_patterns_dict.get(group.name)
                if retrieved_pattern:
                    colombus_pattern.groups.extend(retrieved_pattern.groups or [])
                    continue
                referenced_patterns = [
                    (i, p)
                    for i, p in enumerate(preceding_patterns)
                    if p.name == group.name
                ]
                # TODO: properly manage error case
                if not referenced_patterns:
                    raise Exception(f"Unknown pattern {group.name}")
                ref_pattern_index, ref_pattern = referenced_patterns[-1]
                nested_groups = convert_pattern_to_legacy(
                    preceding_patterns[:ref_pattern_index],
                    ref_pattern,
                    imported_patterns,
                ).groups or []
                if strict_start:
                    nested_groups[0].metaCharacters.startsWith = True
                colombus_pattern.groups.extend(nested_groups)
        else:
            is_element_expr = isinstance(group, ElementExpr)
            conditions_dict = (
                {c.key: c.value for c in group.conditions} if is_element_expr else {}
            )
            steps = []
            if is_element_expr:
                steps = [c.value for c in group.conditions if c.key == "step"]
            if isinstance(group, AlternativeExpr):
                steps = [
                    c.value
                    for a in group.alternatives
                    for c in a.conditions
                    if c.key == "step"
                ]
            colombus_pattern.groups.append(
                PatternGroup(
                    name=f"group_{i}",
                    steps=steps,
                    multiplicity=group.multiplicity if isinstance(group, Expr) else "1",
                    metaInstructions=[
                        PatternMetaInstruction(
                            algoFamily=conditions_dict.get("algoFamily"),
                            algoName=conditions_dict.get("algoName"),
                            library=conditions_dict.get("library"),
                            function=conditions_dict.get("function"),
                        )
                    ],  # TODO
                    metaCharacters=PatternMetaCharacters(
                        startsWith=strict_start and i == 1,
                        endsWith="name" in dir(group) and group.name == "#end",
                        negate=group.conditions[0].op == "!="
                        if is_element_expr
                        else False,
                    ),
                )
            )
    print("\n\n", colombus_pattern)
    return colombus_pattern
