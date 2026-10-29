# Worked Examples (from the Canopus paper) & Domain-Knowledge Bank

## Part 1 — Canonical patterns from the paper (use these as style/syntax references)

Simple structural filter (UC1):
```
pattern DataAcquisition = [
  step="Data Collection"
]
```

Multi-condition filter on the same task:
```
pattern DataAcquisitionCSV = [
  step="Data Collection",
  function="read_csv"
]
```

Boundary assertion + negative condition + multiplicity + composition (reusing a
previously defined pattern as a building block):
```
pattern StartDataAcquisitionCSV = start
  -> DataAcquisitionCSV
  -> [step!="Data Preparation"]+
  -> [step="Data Modeling"]
```

Strict end-to-end compliance pattern (an exact, unrelaxed "representative pipeline"
— in practice this matched ZERO real pipelines, which was itself a finding):
```
pattern InTheSmall = [step="Data Collection"]
  -> [step="Data Preparation"]
  -> [step="Data Modeling"]
  -> [step="Model Evaluation"]
  -> [step="Model Deployment"]
```

Relaxed version allowing arbitrary intervening tasks between required steps (using
bare wildcard `*` as "any one task," chained, to mean "possibly several"):
```
pattern InTheSmallFlex =
  [step="Data Collection"] -> *
  -> [step="Data Preparation"] -> *
  -> [step="Data Modeling"] -> *
  -> [step="Model Evaluation"] -> *
  -> [step="Model Deployment"]
```

Making a step optional via composed pattern + `*` multiplicity:
```
pattern Model Evaluation = [step="Model Evaluation"]

pattern InTheSmallOptEval =
  [step="Data Collection"] -> *
  -> [step="Data Preparation"] -> *
  -> [step="Data Modeling"] -> *
  -> Model Evaluation* -> *
  -> [step="Model Deployment"]
```

Feedback-loop detection (a step recurring after passing through another):
```
pattern FeedbackLoopPrepPred =
  [step="Data Preparation"] -> *
  -> [step="Model Deployment"]
  -> [step="Data Preparation"]

pattern FeedbackLoopModelPred =
  [step="Data Modeling"] -> *
  -> [step="Model Deployment"]
  -> [step="Data Modeling"]
```

"Pipeline jungle" detection (data preparation recurring densely, interleaved with
other work — a bad smell / anti-pattern signature):
```
pattern NotDataPrep = [step!="Data Preparation"]

pattern PipelineJungle = NotDataPrep
  -> [step="Data Preparation"]
  -> NotDataPrep
  -> [step="Data Preparation"]
  -> NotDataPrep
```

End-boundary pattern + composition to discover/name a new emergent step:
```
pattern EndWithDataPrep = [
  step="Data Preparation"
] -> end

pattern SaveResults = [
  step="Model Deployment"
] -> EndWithDataPrep
```

Anti-pattern capturing a conceptual quality issue (potential data contamination —
Data Modeling reoccurring after Model Evaluation/Model Deployment without a clean re-split, i.e. the
model may have been re-fit after "seeing" held-out/test data):
```
pattern Contamination = [step="Data Modeling"]
  -> [step="Model Deployment"]
  -> Model Evaluation*
  -> [step!="Data Modeling"]*
  -> [step="Data Modeling"]
```

Narrow, function-specific pattern used to audit a taxonomy/profiling-function issue
itself (DMatrix construction, from xgboost, is data preparation, not Data Modeling — a
classification bug the expert found BY running this pattern):
```
pattern DMatrixUse = [
  step="Data Modeling",
  function="DMatrix"
]
```

## Part 2 — Domain-knowledge bank for writing rationale

Use this to ground the "what would an ML expert learn from this" part of the output.
Pick what's relevant to the specific pattern being authored; don't dump all of this
into every answer.

**Data leakage / contamination**
- Data Modeling (or re-training) a model after it has had any exposure to Model Evaluation or
  test data — directly or via statistics computed over the full dataset (e.g. scaling
  parameters fit on train+test together) — invalidates the Model Evaluation: reported
  performance will look better than real-world performance. A pattern that detects
  `Data Modeling` recurring after `Model Evaluation`/`Model Deployment` without going through a fresh,
  isolated data split is flagging this risk structurally, without needing to read the
  code.
- "Validation data should be used instead" when iterating after having touched test
  data — i.e. detecting **re-training after Model Evaluation and after Model Deployment** (rather
  than before) is the structural signature worth searching for.

**CACE principle ("Changing Anything Changes Everything")** — Sculley et al. 2015.
Minor structural variations (parameter choices, ordering of steps) can have outsized,
hard-to-predict ripple effects in ML pipelines, unlike in more modular traditional
software. This motivates patterns that pin down *exact* orderings as compliance
targets (strict sequences) as well as patterns that detect *deviations* from an
expected ordering.

**Pipeline jungles & tangled stages** — Biswas et al. 2022 Findings 4 & 5; Sculley et
al. 2015. When `Data Preparation` (or any one step) recurs densely, interleaved
between many other steps rather than being consolidated, this is a maintainability /
technical-debt smell: the pipeline hasn't been modularized, preprocessing logic is
scattered, and small changes become expensive and error-prone to test. Detecting this
structurally (step X recurring between non-X steps, repeated) surfaces pipelines that
would benefit from refactoring into a dedicated preprocessing module.

**Missing / infrequent Model Evaluation** — Biswas et al. 2022 Finding 3. A pipeline that
goes straight from Data Modeling to Model Deployment without an Model Evaluation step
(or only evaluates via ad hoc visualization not captured as a step) is a sign the
author may be under-measuring generalization performance before deploying/submitting
results — worth flagging as a compliance gap, not necessarily "wrong" (e.g. visual
inspection does happen) but worth surfacing.

**Feedback loops** — expected/healthy ones include `Model Evaluation -> (back to)
Data Preparation`, `Model Evaluation -> (back to) Data Modeling`, and `Model Deployment -> (back to)
Data Modeling` (iterative refinement). Their *absence* across a corpus a user expected them
in, or their presence somewhere structurally surprising, are both worth encoding.

**Order-sensitive preprocessing steps (algorithm-specific robustness)**
- Outlier removal vs. scaling: for **distance-based** anomaly/outlier methods (e.g.
  Local Outlier Factor), scaling features *before* outlier detection can distort
  distances and lead to incorrect anomaly identification; removing outliers *before*
  scaling is generally safer for such algorithms. For algorithms that are themselves
  robust to scale or to missing values (e.g. tree-based methods like Isolation Forest,
  or LightGBM's native handling of missing values), the same ordering concern may not
  apply — i.e. whether an ordering is a genuine anti-pattern or an acceptable
  context-specific variation depends on *which* algorithm is downstream. A good
  Canopus pattern + rationale should name this conditionality rather than asserting a
  universal rule.
- Missing-value handling: some implementations (LightGBM) tolerate missing values
  natively; most others require explicit imputation/removal beforehand. A pattern
  that looks for `Data Modeling` with a specific `function=`/`library=` NOT
  preceded by any `Data Preparation` step can be a meaningful anti-pattern signal for
  algorithms that do require explicit handling — but would be a false positive for
  ones that don't. Always scope such a pattern with the relevant `function=`/
  `library=` condition, and say so in the rationale.

**Fairness / bias mitigation compliance (UC2-style)** — whether a pipeline claiming to
address fairness actually invokes a known mitigation technique/library (e.g. a
specific bias-mitigation function), and where in the pipeline it occurs relative to
Data Preparation/Data Modeling, is itself the kind of question Canopus is built to answer:
"is this approach really used in practice, by whom, and in what surrounding context?"

**Taxonomy/profiling-function auditing** — patterns aren't only useful for finding
good/bad pipeline practices; they're also useful for **auditing the classification
system itself** (the `DMatrixUse` example: a function was systematically
mis-classified as `Data Modeling` when it's conceptually `Data Preparation`). When a
pattern's purpose is this kind of meta-level check, say so explicitly in the
rationale — it's a different (but equally valid) kind of insight than a practice/
anti-practice finding.

**Single-step filters are still useful** — not every useful pattern needs boundaries,
multiplicity, or composition. A one-line `[step="X", function="Y"]` filter that
selects a meaningful subpopulation of a corpus (UC1-style) is a complete, legitimate
pattern; don't over-engineer simple requests into unnecessarily complex ones.

## Part 3 — Algorithm ↔ preprocessing (in)compatibility knowledge

A distinct and very productive family of patterns targets the **interaction between a
specific preprocessing `function=`/`library=` and a specific downstream
estimator `function=`/`library=`** — independent of `step=` labeling, since both
sides are often labeled the same step (`"Data Preparation"` and `"Data Modeling"`
respectively, or sometimes both folded into `"Data Modeling"`). These patterns encode
algorithm-specific ML knowledge: a transformation that is *necessary* for one model
family can be *redundant* or even *counter-productive* for another. Three distinct
flavors are worth distinguishing in the rationale:

1. **Unnecessary-but-harmless** — present, costs engineering effort / pipeline
   complexity, but doesn't hurt model quality.
2. **Unnecessary-and-potentially-harmful** — present, and can measurably degrade the
   model (not just redundant computation).
3. **Missing-and-necessary** — absent, and the downstream estimator will error out,
   silently misbehave, or systematically under-perform without it.

### Compatibility table (representative, not exhaustive)

| Preprocessing step | Needed for | Redundant for | Why |
|---|---|---|---|
| `StandardScaler` / `MinMaxScaler` (feature scaling) | distance/gradient-based: `KNeighborsClassifier`, `SVC`, `LogisticRegression` (regularized), `PCA`, `KMeans`, neural nets | tree-based: `RandomForestClassifier`, `DecisionTreeClassifier`, `GradientBoostingClassifier`, `XGBClassifier`, `LGBMClassifier` | Trees split on thresholds per feature independently and are invariant to monotonic rescaling; distance/gradient-based methods are not. |
| `OneHotEncoder` (one-hot encoding of categoricals) | linear models, distance-based models, neural nets — anything that treats feature values as having a meaningful numeric/geometric relationship, where an arbitrary ordinal encoding would be wrong | tree ensembles (`RandomForestClassifier`, `LGBMClassifier`, `CatBoostClassifier`, `HistGradientBoostingClassifier`) | Trees split categories directly (natively, via ordinal/label encoding, or via built-in categorical support in LightGBM/CatBoost/`HistGradientBoostingClassifier`) without needing a numeric *ordering* to make sense. One-hot encoding high-cardinality categoricals before a tree ensemble inflates dimensionality, dilutes each feature's information per split, and can measurably *hurt* split quality and feature-importance interpretability — this is flavor (2), not just flavor (1). Caveat: plain scikit-learn `RandomForestClassifier`/`DecisionTreeClassifier` still require *some* numeric encoding (they can't consume raw strings) — the claim is that one-hot specifically is often the wrong choice versus ordinal/label/target encoding or a tree-native-categorical implementation, not that *no* encoding is needed at all. State this caveat explicitly in the rationale rather than implying OHE is simply unnecessary for all tree-based code paths. |
| Missing-value imputation (`SimpleImputer`, `fillna`, etc.) | most estimators: `LogisticRegression`, `SVC`, `KNeighborsClassifier`, `RandomForestClassifier` (sklearn) | estimators with native NaN handling: `LGBMClassifier`, `XGBClassifier` (with default missing handling), `CatBoostClassifier`, `HistGradientBoostingClassifier` | Most sklearn estimators raise on NaNs or silently mishandle them; a handful of modern implementations route missing values through the split-finding logic natively. |
| Dimensionality reduction (`PCA`, etc.) before Data Modeling | high-dimensional linear/distance-based models where the curse of dimensionality or multicollinearity hurts (`LogisticRegression`, `KNeighborsClassifier`) | tree ensembles (which perform implicit feature selection via split importance) | Not wrong to use with trees, but often adds complexity/loses interpretability without a clear quality benefit; worth flagging as a complexity smell rather than a correctness bug. |

### Worked patterns

Unnecessary one-hot encoding immediately feeding a tree ensemble (flavor 2 — a
genuine, not just cosmetic, anti-pattern):
```
pattern UnnecessaryOHEBeforeTree = [
  function="OneHotEncoder"
] -> [step!="Data Modeling"]*
  -> (
    [function="RandomForestClassifier"]
    | [function="LGBMClassifier"]
    | [function="CatBoostClassifier"]
    | [function="HistGradientBoostingClassifier"]
  )
```

Redundant scaling before a tree ensemble (flavor 1 — harmless but worth noting as
unnecessary complexity):
```
pattern RedundantScalingBeforeTree = (
  [function="StandardScaler"] | [function="MinMaxScaler"]
) -> [step!="Data Modeling"]*
  -> (
    [function="RandomForestClassifier"]
    | [function="GradientBoostingClassifier"]
    | [function="XGBClassifier"]
  )
```

Missing scaling before a distance-based estimator (flavor 3 — using `start` and
negative conditions to assert absence across the whole prefix, since Canopus has no
native "does not contain anywhere" operator outside of an explicit bounded prefix):
```
pattern MissingScalingBeforeKNN = start
  -> [function!="StandardScaler", function!="MinMaxScaler"]*
  -> [function="KNeighborsClassifier"]
```
Rationale note for this one specifically: this only proves no scaler ran *before* the
first `KNeighborsClassifier` call in a pipeline that starts at the true beginning
(hence anchoring with `start`) — it does not prove scaling never happens at all, nor
does it generalize to a `KNeighborsClassifier` call that isn't the first. For corpora
where that distinction matters, say so rather than overclaiming "this pipeline never
scales."

### How to use this table when drafting a new pattern

When a user describes a request like "flag preprocessing step X paired with model Y"
that isn't already in the table above, reason from the same underlying question the
table encodes: *does the downstream estimator's mathematical behavior actually depend
on the property that preprocessing step provides (scale-sensitivity, need for numeric
/ one-hot-safe encoding, intolerance of missing values, sensitivity to
dimensionality)?* If yes and the step is present → likely necessary, not an
anti-pattern. If yes and the step is absent → flavor 3. If no and the step is present
→ flavor 1 or 2 depending on whether it demonstrably degrades quality (flavor 2) or is
merely extra complexity (flavor 1). Always name which flavor applies in the rationale,
since the practical "what should the user do about it" advice differs by flavor.
