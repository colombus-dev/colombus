from difflib import SequenceMatcher
from io import BytesIO
from itertools import groupby
from textwrap import wrap
from typing import Any, Sequence

from fastapi import APIRouter
from fastapi.responses import Response, StreamingResponse
from plotly import express as px
from pydantic import BaseModel
from seaborn import color_palette
from sqlmodel import col, func, select

from app.constants import __TMP_ENCODING_MAPPING
from app.dependencies import DatabaseSession
from app.models.sql_model import Profile, Step
from app.utils.diff_stats_exploration import get_frequent_patterns_matrix

router = APIRouter()


@router.get("/api/project/{project_id}/stats")
async def get_project_stats(project_id: str, session: DatabaseSession):
    # TODO: seems duplicated with get_frequent_patterns_matrix

    profiles_content = session.exec(
        select(Profile.name, Step.id, Step.name)
        .join(Step)
        .where(Profile.project_id == project_id)
        .order_by(Profile.name)
    ).all()

    def get_grouped_profiles_content():
        return groupby(profiles_content, lambda e: e[0])

    # TODO: replace with DiffResult
    results: list[dict[str, Any]] = []

    # retrieving matching groups for each profile compared to each
    # other profile

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
            results.append(
                {
                    "profile_name": f"{profile_id_1}_-TO-_{profile_id_2}",
                    "results": [
                        [
                            (e[2], block)
                            for e in profile_steps_2[block.b : block.b + block.size]
                        ]
                        for block in seq_match.get_matching_blocks()[:-1]
                    ],
                    "ratio": seq_match.ratio(),
                }
            )

    def ratio_sort_key(r: dict[str, Any]) -> int:
        return r["ratio"]

    return sorted(results, key=ratio_sort_key, reverse=True)


class PostStatsProfilesFilterPayload(BaseModel):
    profiles_names: list[str] | None = None


@router.post("/api/project/{project_id}/stats/patterns")
async def post_project_stats_patterns(
    project_id: str,
    payload: PostStatsProfilesFilterPayload,
    session: DatabaseSession,
):
    if payload.profiles_names:
        nb_profiles = len(payload.profiles_names)
    else:
        nb_profiles = session.exec(select(func.count(col(Profile.id)))).one()

    query = (
        select(Profile.name, Step.id, Step.name)
        .join(Step)
        .where(Profile.project_id == project_id)
    )
    if payload.profiles_names:
        query = query.where(col(Profile.name).in_(payload.profiles_names))
    query = query.order_by(Profile.name, col(Step.position))
    profiles_content = session.exec(query).all()

    freq_patterns_matrix = get_frequent_patterns_matrix(profiles_content)

    MAX_NB_PATTERNS = 10
    matrix_top = freq_patterns_matrix[:MAX_NB_PATTERNS].copy()

    full_labels = matrix_top.index.tolist()
    matrix_top.index = full_labels

    hover_labels = ["<br>".join(wrap(label, width=50)) for label in full_labels]

    rocket_colors = color_palette("rocket", as_cmap=False, n_colors=256).as_hex()

    fig = px.imshow(
        matrix_top,
        aspect="auto",
        labels=dict(x="Position in the profile (in %)", y="Pattern", color="Frequency"),
        color_continuous_scale=rocket_colors,
    )
    fig.update_traces(
        customdata=[[label] * len(matrix_top.columns) for label in hover_labels],
        hovertemplate=f"Pattern: %{{customdata}}<br>Position: %{{x}}<br>Frequency: %{{z}} / {nb_profiles}<extra></extra>",
    )

    truncated_labels = [
        (label[:37] + "...") if len(label) > 40 else label for label in full_labels
    ]

    fig.update_layout(
        margin=dict(l=20, r=20, t=50, b=50),
        yaxis=dict(
            automargin=True,
            showticklabels=False,
        ),
        xaxis=dict(
            tickmode="array",
            tickvals=[f"{i}%" for i in range(0, 101, 20)],
        ),
    )

    return Response(content=fig.to_json(), media_type="application/json")


@router.post("/api/project/{project_id}/stats/steps/frequency")
async def post_steps_frequency(
    project_id: str,
    payload: PostStatsProfilesFilterPayload,
    session: DatabaseSession,
) -> Sequence[tuple[str, int]]:
    query = (
        select(Step.name, func.count(col(Step.id)))
        .join(Profile)
        .where(Profile.project_id == project_id)
    )
    if payload.profiles_names:
        query = query.where(col(Profile.name).in_(payload.profiles_names))
    query = query.group_by(Step.name)
    return session.exec(query).all()
