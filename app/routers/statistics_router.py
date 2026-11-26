from collections import Counter
from textwrap import wrap
from typing import Sequence

from fastapi import APIRouter
from fastapi.responses import Response
from plotly import express as px
from pydantic import BaseModel
from sqlmodel import col, func, select

from app.dependencies import DatabaseSession
from app.models.sql_model import MetaInstruction, Profile
from app.utils.diff_stats_exploration import get_frequent_patterns_matrix

router = APIRouter()

ROCKET_COLOR_SCALE = [
    "#03051a",
    "#271534",
    "#4c1d4b",
    "#751f58",
    "#a11a5b",
    "#cb1b4f",
    "#e83f3f",
    "#f26f4c",
    "#f69c73",
    "#f7c6a6",
    "#faebdd",
]


def get_steps_by_profile_name(
    session: DatabaseSession, project_id: int, profile_ids: list[int] | None = None
) -> list[tuple[str, str]]:
    if profile_ids is not None and len(profile_ids) == 0:
        profile_ids = None
    profile_names = dict(
        session.exec(
            select(Profile.id, Profile.name).where(Profile.project_id == project_id)
        ).all()
    )
    step_starts = MetaInstruction.get_step_starts(session, project_id, profile_ids)
    ordered_steps = sorted(
        step_starts, key=lambda step: (profile_names[step.profile_id], step.id)
    )
    return [(profile_names[step.profile_id], step.name) for step in ordered_steps]


class PostStatsProfilesFilterPayload(BaseModel):
    profile_ids: list[int] | None = None


@router.post("/api/projects/{project_id}/stats/patterns")
async def post_project_stats_patterns(
    project_id: int,
    payload: PostStatsProfilesFilterPayload,
    session: DatabaseSession,
):
    if payload.profile_ids:
        nb_profiles = len(payload.profile_ids)
    else:
        nb_profiles = session.exec(select(func.count(col(Profile.id)))).one()

    profiles_content = get_steps_by_profile_name(
        session, project_id, payload.profile_ids
    )

    freq_patterns_matrix = get_frequent_patterns_matrix(profiles_content)

    MAX_NB_PATTERNS = 10
    matrix_top = freq_patterns_matrix[:MAX_NB_PATTERNS].copy()

    full_labels = [str(label) for label in matrix_top.index.tolist()]
    matrix_top.index = full_labels

    hover_labels = ["<br>".join(wrap(label, width=50)) for label in full_labels]

    fig = px.imshow(
        matrix_top,
        aspect="auto",
        labels=dict(x="Position in the profile (in %)", y="Pattern", color="Frequency"),
        color_continuous_scale=ROCKET_COLOR_SCALE,
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


@router.post("/api/projects/{project_id}/stats/steps/frequency")
async def post_steps_frequency(
    project_id: int,
    payload: PostStatsProfilesFilterPayload,
    session: DatabaseSession,
) -> Sequence[tuple[str, int]]:
    steps = get_steps_by_profile_name(session, project_id, payload.profile_ids)
    return list(Counter(step_name for _, step_name in steps).items())
