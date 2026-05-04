import sys
import os

from app.utils.convert_canopus_to_legacy import convert_canopus_pattern_to_legacy
from canopus_dsl import parse_canopus_program

test_string = """# Create a new pattern below
pattern na=[step="Load data"]"""

try:
    patterns = parse_canopus_program(test_string)
    print(f"Success! Patterns: {patterns}")
except Exception as e:
    print(f"Error parsing Canopus: {e}")
