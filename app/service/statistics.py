from itertools import pairwise

import numpy as np
import pandas as pd
from pydantic import BaseModel


class ScoresOverallPerforamnce(BaseModel):
    number_of_scores: int
    mean: float
    median: float
    minimum: float
    maximum: float


class ScoresDistribution(BaseModel):
    p10: float
    p25: float
    p50: float
    p75: float
    p90: float
    p90_minus_p10: float
    iqr: float
    range: float


class ScoresConsistency(BaseModel):
    std: float
    var: float
    coeff_var: float


class ScoresPerformanceBins(BaseModel):
    bins: dict[str, float]


class ScoresStatistics(BaseModel):
    overall_performance: ScoresOverallPerforamnce
    distribution: ScoresDistribution
    consistency: ScoresConsistency
    bins: ScoresPerformanceBins


def describe_scores_set(scores: list[float]) -> ScoresStatistics:
    scores_df = pd.Series(scores, name="scores")

    overall_performance = ScoresOverallPerforamnce(
        number_of_scores=len(scores_df),
        mean=scores_df.mean(),
        median=scores_df.median(),
        minimum=scores_df.min(),
        maximum=scores_df.max(),
    )

    percentiles = scores_df.quantile([0.10, 0.25, 0.50, 0.75, 0.90])
    distribution = ScoresDistribution(
        p10=percentiles.loc[0.10],
        p25=percentiles.loc[0.25],
        p50=percentiles.loc[0.50],
        p75=percentiles.loc[0.75],
        p90=percentiles.loc[0.90],
        p90_minus_p10=percentiles.loc[0.90] - percentiles.loc[0.10],
        iqr=percentiles.loc[0.75] - percentiles.loc[0.25],
        range=scores_df.max() - scores_df.min(),
    )

    consistency = ScoresConsistency(
        std=scores_df.std(),
        var=scores_df.var(),
        coeff_var=scores_df.std() / scores_df.mean() * 100
        if scores_df.mean() != 0
        else np.nan,
    )

    bins = [0.0, 0.2, 0.4, 0.6, 0.8, 1.0]
    labels = [f"{low} - {high}" for low, high in pairwise(bins)]

    bins = ScoresPerformanceBins(
        bins=pd.cut(
            scores_df, bins=bins, labels=labels, right=False, include_lowest=True
        )
        .value_counts()
        .to_dict()
    )

    return ScoresStatistics(
        overall_performance=overall_performance,
        distribution=distribution,
        consistency=consistency,
        bins=bins,
    )
