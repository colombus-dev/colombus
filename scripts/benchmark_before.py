#!/usr/bin/env -S uv run python
import argparse
import json
import statistics
import time
import uuid

from sqlmodel import Session, text

from app.models.api_model import PatternGroup, PatternMetaCharacters
from app.models.sql_model import engine
from app.utils.convert_ppm_to_sql import convert_steps_to_sql_query_template


def build_pattern(steps: list[str]) -> list[PatternGroup]:
    return [
        PatternGroup(
            name=f"g{i}",
            steps=[step],
            multiplicity="1",
            metaCharacters=PatternMetaCharacters(
                startsWith=False, endsWith=False, negate=False
            ),
        )
        for i, step in enumerate(steps)
    ]


def timing_stats(samples_ms: list[float]) -> dict:
    ordered = sorted(samples_ms)
    p95_index = min(len(ordered) - 1, int(len(ordered) * 0.95))
    return {
        "count": len(ordered),
        "min_ms": round(ordered[0], 3),
        "mean_ms": round(statistics.mean(ordered), 3),
        "median_ms": round(statistics.median(ordered), 3),
        "p95_ms": round(ordered[p95_index], 3),
        "max_ms": round(ordered[-1], 3),
    }


def run(project_id: uuid.UUID, steps: list[str], repeat: int) -> dict:
    pattern = build_pattern(steps)
    query = convert_steps_to_sql_query_template(project_id, pattern)

    timings_ms = []
    match_occurrences = 0
    matches: list[str] = []
    with Session(engine) as session:
        for i in range(repeat):
            start = time.perf_counter()
            rows = session.execute(text(query)).all()
            timings_ms.append((time.perf_counter() - start) * 1000)
            if i == 0:
                match_occurrences = len(rows)
                matches = sorted({row[0] for row in rows})

    return {
        "approach": "before",
        "matches": matches,
        "match_occurrences": match_occurrences,
        "timing_ms": timing_stats(timings_ms),
    }


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--project-id", required=True, type=uuid.UUID)
    parser.add_argument(
        "--steps",
        nargs="+",
        required=True,
        help="Ordered step names to match, e.g. --steps 'Data Preparation' 'Data Acquisition'.",
    )
    parser.add_argument(
        "--repeat",
        type=int,
        default=20,
        help="Number of timed executions (default: 20).",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> None:
    args = parse_args(argv)
    result = run(args.project_id, args.steps, args.repeat)
    print(json.dumps(result, indent=2, default=str))


if __name__ == "__main__":
    main()
