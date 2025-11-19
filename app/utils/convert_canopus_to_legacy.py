from canopus_dsl import Pattern as CanopusPattern, ElementExpr, Expr
from app.models.api_model import Pattern, PatternGroup, PatternMetaCharacters


def convert_pattern_to_legacy(
    preceding_patterns: list[CanopusPattern],
    last_pattern: CanopusPattern,
    imported_patterns: list[Pattern],
) -> Pattern:
    # TODO: replace with visitor
    imported_patterns_dict = {pattern.name: pattern for pattern in imported_patterns}
    colombus_pattern = Pattern(name=last_pattern.name, groups=[])
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
                    colombus_pattern.groups.extend(retrieved_pattern.groups)
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
                colombus_pattern.groups.extend(
                    convert_pattern_to_legacy(
                        preceding_patterns[:ref_pattern_index],
                        ref_pattern,
                        imported_patterns,
                    ).groups
                )
        else:
            colombus_pattern.groups.append(
                PatternGroup(
                    name=f"group_{i}",
                    steps=[c.value for c in group.conditions if c.key == "step"]
                    if isinstance(group, ElementExpr)
                    else [],
                    multiplicity=group.multiplicity if isinstance(group, Expr) else "1",
                    metaInstructions=[],  # TODO
                    metaCharacters=PatternMetaCharacters(
                        startsWith=strict_start and i == 1,
                        endsWith="name" in dir(group) and group.name == "#end",
                        negate=False,  # TODO
                    ),
                )
            )
    return colombus_pattern
