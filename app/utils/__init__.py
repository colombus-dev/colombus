import re

_DIGITS = re.compile(r"(\d+)")


def natural_key(value: str) -> list[int | str]:
    return [
        int(part) if part.isdigit() else part.casefold()
        for part in _DIGITS.split(value)
    ]
