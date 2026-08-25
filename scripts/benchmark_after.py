#!/usr/bin/env -S uv run python
import argparse
import json
import statistics
import time
import uuid

from sqlmodel import Session, text

from app.models.sql_model import engine


def ensure_index(session: Session) -> None:
    session.execute(
        text(
            "CREATE INDEX IF NOT EXISTS ix_step_profile_id_position "
            "ON step (profile_id, position)"
        )
    )
    session.commit()


def _is_wildcard_term(term: str) -> bool:
    return "*" in term or "?" in term


def _glob_to_sql_like(term: str) -> str:
    pattern = []
    for char in term:
        if char == "*":
            pattern.append("%")
        elif char == "?":
            pattern.append("_")
        elif char in ("%", "_", "\\"):
            pattern.append(f"\\{char}")
        else:
            pattern.append(char)
    return "".join(pattern)


def build_query(steps: list[str]) -> str:
    aliases = [f"s{i}" for i in range(len(steps))]
    joins = [f"FROM step AS {aliases[0]}"]
    for i in range(1, len(steps)):
        joins.append(
            f"JOIN step AS {aliases[i]} "
            f"ON {aliases[i]}.profile_id = {aliases[i - 1]}.profile_id "
            f"AND {aliases[i]}.position > {aliases[i - 1]}.position"
        )
    where_clauses = [
        f"{alias}.name LIKE :step{i} ESCAPE '\\'"
        if _is_wildcard_term(step)
        else f"{alias}.name = :step{i}"
        for i, (alias, step) in enumerate(zip(aliases, steps))
    ]

    return (
        "SELECT DISTINCT p.name "
        + " ".join(joins)
        + f" JOIN profile AS p ON p.id = {aliases[0]}.profile_id "
        + "WHERE p.project_id = :project_id AND "
        + " AND ".join(where_clauses)
    )


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
    query = build_query(steps)
    params = {"project_id": str(project_id)}
    params.update(
        {
            f"step{i}": _glob_to_sql_like(step) if _is_wildcard_term(step) else step
            for i, step in enumerate(steps)
        }
    )

    timings_ms = []
    matches: list[str] = []
    with Session(engine) as session:
        ensure_index(session)
        for i in range(repeat):
            start = time.perf_counter()
            rows = session.execute(text(query), params).all()
            timings_ms.append((time.perf_counter() - start) * 1000)
            if i == 0:
                matches = [row[0] for row in rows]

    return {
        "approach": "after self-join on step.position",
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
