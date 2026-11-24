import re
from typing import Mapping

from app.constants import __TMP_ENCODING_MAPPING

_DIGITS = re.compile(r"(\d+)")


def format_template(step_name: str, attributes: Mapping[str, str]) -> str:
    other_attributes = r'(?:,\s*"[^"]*":\s*"[^"]*")*?'
    return (
        r"\{\s*"
        + r'"step":\s*"{step_name}"'.format(step_name=step_name)
        + "".join(
            other_attributes + r',\s*"{key}":\s*"{value}"'.format(key=key, value=value)
            for key, value in sorted(attributes.items())
        )
        + r'(?:,\s*"[^"]*":\s*"[^"]*")*'
        + r"\s*\}"
    )


def encode_step_name(step_name: str) -> str:
    return __TMP_ENCODING_MAPPING[step_name]


def encode_profile(all_steps_names: list[str]) -> str:
    return "".join(__TMP_ENCODING_MAPPING[step_name] for step_name in all_steps_names)


def natural_key(value: str) -> list[int | str]:
    return [
        int(part) if part.isdigit() else part.casefold()
        for part in _DIGITS.split(value)
    ]
