import sys
from app.routers.pattern_router import parse_pattern_api
from app.models.api_model import ParsePatternInput
import asyncio
from unittest.mock import MagicMock

# The parse logic is usually not async or simple enough
from app.utils.convert_canopus_to_legacy import convert_canopus_pattern_to_legacy
from canopus_dsl import parse_canopus_program

try:
    patterns = parse_canopus_program('# Create a new pattern below\npattern na=[step="Load data"]')
    print(f"Success! Patterns: {patterns}")
except Exception as e:
    print(f"Error: {e}")

