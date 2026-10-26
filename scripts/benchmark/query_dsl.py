#!/usr/bin/env -S uv run python
import argparse
import json
import time
import uuid

from query import MANIFEST_PATH, resolve_project_id, sequence_matches, timing_stats
from sqlalchemy.exc import OperationalError
from sqlmodel import Session, text

from app.models.api_model import PatternGroup, PatternMetaCharacters
from app.models.sql_model import engine
from app.utils.convert_ppm_to_sql import convert_steps_to_sql_query_template

GAP_MARKER = "*"

TIMED_OUT_TIMING = {
    "count": -1,
    "min_ms": -1,
    "mean_ms": -1,
    "median_ms": -1,
    "p95_ms": -1,
    "max_ms": -1,
}


def build_pattern(terms: list[str]) -> list[PatternGroup]:
    return [
        PatternGroup(
            name=f"g{i}",
            steps=[] if term == GAP_MARKER else [term],
            multiplicity="1",
            metaCharacters=PatternMetaCharacters(
                startsWith=False, endsWith=False, negate=False
            ),
        )
        for i, term in enumerate(terms)
    ]


def run_dsl_query(
    project_id: uuid.UUID, terms: list[str], repeat: int, quiet: bool
) -> dict:
    pattern = build_pattern(terms)
    query = convert_steps_to_sql_query_template(project_id, pattern)
    if not quiet:
        print(f"query:\n{query}\n")

    timings_ms = []
    matches: list[dict] = []
    with Session(engine) as session:
        for i in range(repeat):
            start = time.perf_counter()
            try:
                rows = session.execute(text(query)).all()
            except OperationalError as e:
                if "statement timeout" not in str(e):
                    raise
                session.rollback()
                return {
                    "matches": [],
                    "match_occurrences": -1,
                    "timing_ms": TIMED_OUT_TIMING,
                    "timed_out": True,
                }
            timings_ms.append((time.perf_counter() - start) * 1000)
            if i == 0:
                grouped: dict[str, list] = {}
                for row in rows:
                    occurrence = [str(step_id) for col in row[1:] for step_id in col]
                    grouped.setdefault(row[0], []).append(occurrence)
                matches = [
                    {"profile_name": name, "occurrences": occurrences}
                    for name, occurrences in grouped.items()
                ]

    match_occurrences = sum(len(m["occurrences"]) for m in matches)
    return {
        "matches": matches,
        "match_occurrences": match_occurrences,
        "timing_ms": timing_stats(timings_ms),
    }


def run_test_mode(repeat: int, quiet: bool) -> None:
    manifest = json.loads(MANIFEST_PATH.read_text())
    profiles = manifest["notebooks"]
    project_id = resolve_project_id()

    all_correct = True
    for name, terms in manifest["needles"].items():
        expected = sorted(
            profile_name
            for profile_name, profile in profiles.items()
            if sequence_matches(profile["steps"], terms)
        )
        result = run_dsl_query(project_id, terms, repeat, quiet)

        if result.get("timed_out"):
            all_correct = False
            print(f"[TIMEOUT] {name} ({len(terms)} terms)")
            continue

        actual = sorted(m["profile_name"] for m in result["matches"])
        correct = actual == expected
        all_correct = all_correct and correct

        status = "OK" if correct else "MISMATCH"
        print(
            f"[{status}] {name} ({len(terms)} terms) "
            f"expected={len(expected)} actual={len(actual)} "
            f"median_ms={result['timing_ms']['median_ms']}"
        )

    if not all_correct:
        raise SystemExit(1)


def run_query_mode(
    terms: list[str], project_id: uuid.UUID | None, repeat: int, quiet: bool
) -> None:
    if project_id is None:
        project_id = resolve_project_id()

    result = run_dsl_query(project_id, terms, repeat, quiet)
    print(json.dumps(result, indent=2))


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--steps",
        nargs="+",
        help="Ordered step names",
    )
    parser.add_argument("--project-id", type=uuid.UUID, default=None)
    parser.add_argument("--repeat", type=int, default=20)
    parser.add_argument("--test", action="store_true")
    parser.add_argument("--quiet", action="store_true")
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> None:
    args = parse_args(argv)
    if args.test:
        run_test_mode(args.repeat, args.quiet)
        return
    if not args.steps:
        raise SystemExit("pass --steps or --test")
    run_query_mode(args.steps, args.project_id, args.repeat, args.quiet)


if __name__ == "__main__":
    main()
