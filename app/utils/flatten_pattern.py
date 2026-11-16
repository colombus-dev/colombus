from app.models.api_model import PatternGroup


def flatten_pattern(pattern: list[PatternGroup]) -> list[PatternGroup]:
    flattened_pattern = []
    for group in pattern:
        if group.subpattern and group.subpattern.groups:
            flattened_pattern.extend(flatten_pattern(group.subpattern.groups))
        else:
            flattened_pattern.append(group)
    return flattened_pattern
