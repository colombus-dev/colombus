from difflib import Match, SequenceMatcher
from itertools import groupby
from uuid import UUID
from typing import Sequence

import pandas as pd
from pydantic import BaseModel

from app.utils import __TMP_ENCODING_MAPPING


class ResultMatch(BaseModel):
    letters: list[str]
    match: Match


class Result(BaseModel):
    profile_name: str
    results: list[ResultMatch]
    total_size_a: int
    total_size_b: int
    ratio: float


def get_frequent_patterns_matrix(
    profiles_content: Sequence[tuple[str, UUID, str]],
) -> pd.DataFrame:
    def get_grouped_profiles_content():
        return groupby(profiles_content, lambda e: e[0])

    all_comb_results: list[Result] = []

    for profile_id_1, profile_steps_1_iter in get_grouped_profiles_content():
        profile_steps_1 = list(profile_steps_1_iter)
        for (
            profile_id_2,
            profile_steps_2_iter,
        ) in get_grouped_profiles_content():
            if profile_id_1 == profile_id_2:
                continue
            profile_steps_2 = list(profile_steps_2_iter)
            elem_a = "".join(__TMP_ENCODING_MAPPING[pe[2]] for pe in profile_steps_1)
            elem_b = "".join(__TMP_ENCODING_MAPPING[pe[2]] for pe in profile_steps_2)
            seq_match = SequenceMatcher(None, elem_a, elem_b, autojunk=False)
            all_comb_results.append(
                Result(
                    profile_name=f"{profile_id_1}_-TO-_{profile_id_2}",
                    total_size_a=len(elem_a),
                    total_size_b=len(elem_b),
                    results=[
                        ResultMatch(
                            letters=[
                                e[2]
                                for e in profile_steps_2[block.b : block.b + block.size]
                            ],
                            match=block,
                        )
                        for block in seq_match.get_matching_blocks()[:-1]
                    ],
                    ratio=seq_match.ratio(),
                )
            )

    all_matches = {" -> ".join(m.letters) for r in all_comb_results for m in r.results}
    matching_matrix = {
        k: {
            n
            for v in all_comb_results
            for n in v.profile_name.split("_-TO-_")
            if k in [" -> ".join(m.letters) for m in v.results]
        }
        for k in all_matches
    }

    sorted_matching_matrix = dict(
        sorted(matching_matrix.items(), key=lambda m: len(m[1]), reverse=True)
    )

    positions_register = {
        " -> ".join(m.letters) + f" :: {r.profile_name.split('_-TO-_')[0]}": (
            m.match.a,
            m.match.size,
            r.total_size_a,
        )
        for r in all_comb_results
        for m in r.results
    }

    columns_matches = []

    PERCENTAGE_TICK = 1

    position_percentages = list(range(0, 100 + PERCENTAGE_TICK, PERCENTAGE_TICK)) + [
        "TOTAL"
    ]
    matrix = []
    errors = 0
    for k, v in sorted_matching_matrix.items():
        columns_matches.append(k)
        k_positions = [0] * len(position_percentages)
        matrix.append(k_positions)
        for p in v:
            try:
                start, size, total = positions_register[f"{k} :: {p}"]
            except:  # noqa: E722
                errors += 1
                # TODO: fix these errors
                continue
            start_percentage, end_percentage = (
                int(start * 100 / total),
                int((start + size) * 100 / total),
            )
            for i in range(
                int(start_percentage / PERCENTAGE_TICK),
                int(end_percentage / PERCENTAGE_TICK),
            ):
                k_positions[i] += 1
            k_positions[-1] += 1

    print("errors=", errors)

    df = pd.DataFrame(matrix, index=columns_matches)
    df.columns = df.columns.tolist()[:-1] + ["Total"]

    # returning sorted df by max value per row
    return df.reindex(df.iloc[:, :-1].max(1).sort_values(ascending=False).index)
