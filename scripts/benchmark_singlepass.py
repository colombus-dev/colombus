#!/usr/bin/env -S uv run python
import argparse
import json
import statistics
import time
import uuid

from sqlmodel import Session, text

from app.models.sql_model import engine

TOKEN_DELIMITER = "\x1f"


def _glob_to_are(term: str) -> str:
    pattern = []
    for char in term:
        if char == "*":
            pattern.append(f"[^{TOKEN_DELIMITER}]*")
        elif char == "?":
            pattern.append(f"[^{TOKEN_DELIMITER}]")
        else:
            pattern.append(char)
    return "".join(pattern)


def _term_to_token_pattern(term: str) -> str:
    return rf"{TOKEN_DELIMITER}{_glob_to_are(term)}(?={TOKEN_DELIMITER})"


def compile_pattern(steps: list[str]) -> str:
    return "".join(_term_to_token_pattern(step) for step in steps)


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


QUERY = """
    WITH sequences AS (
        SELECT
            p.name AS profile_name,
            :delimiter || string_agg(s.name, :delimiter ORDER BY s.position) || :delimiter
                AS token_string
        FROM step s
        JOIN profile p ON p.id = s.profile_id
        WHERE p.project_id = :project_id
        GROUP BY p.id, p.name
    )
    SELECT profile_name
    FROM sequences
    WHERE token_string ~ :pattern
"""


def run(project_id: uuid.UUID, steps: list[str], repeat: int) -> dict:
    pattern = compile_pattern(steps)
    print(f"query={QUERY}")
    print(f"pattern={pattern}")

    params = {
        "project_id": str(project_id),
        "delimiter": TOKEN_DELIMITER,
        "pattern": pattern,
    }

    timings_ms = []
    matches: list[str] = []
    with Session(engine) as session:
        for i in range(repeat):
            start = time.perf_counter()
            rows = session.execute(text(QUERY), params).all()
            timings_ms.append((time.perf_counter() - start) * 1000)
            if i == 0:
                matches = sorted(row[0] for row in rows)

    return {
        "approach": "postgres single-pass string_agg + regex",
        "matches": matches,
        "timing_ms": timing_stats(timings_ms),
    }


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--project-id", required=True, type=uuid.UUID)
    parser.add_argument(
        "--steps",
        nargs="+",
        required=True,
        help="Ordered step names to match; '*'/'?' wildcards allowed, "
        "e.g. --steps 'Data Prep*' 'Data Acquisition'.",
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
