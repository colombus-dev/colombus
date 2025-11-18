from canopus_dsl import Pattern as CanopusPattern, ElementExpr, Expr
from app.models.api_model import Pattern, PatternGroup, PatternMetaCharacters


def convert_pattern_to_legacy(pattern: CanopusPattern) -> Pattern:
    colombus_pattern = Pattern(name=pattern.name, groups=[])
    strict_start = False
    for i, group in enumerate(pattern.sequence):
        if "name" in dir(group) and group.name == "#start":
            strict_start = True
            continue
        if "name" in dir(group) and group.name == "#end":
            colombus_pattern.groups[-1].metaCharacters.endsWith = True
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
