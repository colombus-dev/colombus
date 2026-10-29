# ML Step Taxonomy & Description-Key Vocabulary (default)

Canopus's `condition` keys (`step=`, `function=`, `library=`, ...) are open-ended by
design — the DSL just queries whatever `Information`/`Description` keys a given
knowledge base's profiling functions have attached to tasks (see metamodel, §5 of the
paper). There is no fixed enum in the grammar itself.

This skill defaults to the taxonomy actually used in the Canopus paper's own
evaluation (reproducing Biswas, Wardat & Rajan, "The Art and Practice of Data Science
Pipelines," ICSE 2022), because it's the one the paper's examples are grounded in and
the one most Kaggle/notebook-style pipelines map onto cleanly. Always ask the user (or
infer from context) if they're working against a different / custom taxonomy before
assuming this one — many real deployments extend or rename these.

## `step=` values

### "Unified" taxonomy (6 stages)

This is the practical default for notebook/Kaggle-style pipelines, and exactly what every worked example uses for `step=`:

| Stage | What it covers |
|---|---|
| Data Collection | collecting/integrating data from sources |
| Data Preparation | cleaning, filtering, exploring raw data |
| Data Modeling | model planning, selection, architecture, fitting |
| Model Deployment | applying the model to unknown inputs |
| Model Evaluation | testing against held-out data / metrics |
| Save Results | serializing and persisting data for future use or analysis |

### Emergent / extended steps observed empirically (not in the original 11, but
discovered via Canopus pattern exploration itself — legitimate to use, and a good
example of how the taxonomy is meant to evolve)
- `"Save Results"` — exporting predictions for submission (discovered via the
  `SaveResults` pattern in the paper: `Model Deployment -> step="Data Preparation" -> end`
  sequences that are really about packaging output, not further data prep)
- `"Exploratory Data Analysis"` (EDA), `"Visualization"` — noted
  in the original Biswas et al. study as present in practice but outside the formal
  11-stage theory

When a user's request implies a step/category not in these lists, it's fine to
introduce it as a `step="Your New Category"` value — that's exactly the kind of
incremental, non-prescriptive enrichment the metamodel is designed for (§5.2 of the
paper). Just flag it clearly in the rationale as a newly-introduced category rather
than silently treating it as if it were standard.

## Other common condition keys

- `function="..."` — the literal function/API name invoked (e.g. `"read_csv"`,
  `"DMatrix"`, `"fit"`, `"StandardScaler"`, `"train_test_split"`). Captures *how*
  (concrete implementation), complementing `step=` which captures *what* (semantic
  role). The paper explicitly stresses (Takeaway 3) that "function calls alone are
  ambiguous; contextual descriptors are required to interpret ML practices" — i.e.
  prefer combining `step=` + `function=` over `function=` alone when precision
  matters, and be aware the same function call can plausibly belong to more than one
  step depending on context (e.g. `DMatrix` from xgboost was found mis-classified as
  `Data Modeling` when it's really `Data Preparation` — see examples.md, "DMatrixUse").
- `library="..."` — the originating library/package (e.g. `"xgboost"`, `"sklearn"`,
  `"nnabla"`). Useful for UC2-style compliance checks ("is this fairness technique
  actually implemented via library X, or some other means?").

Profiling functions can in principle expose any further key (benchmark used, model
hyperparameter, dataset name, etc. — §5.2) — treat the above as the well-attested
starting vocabulary, not a hard ceiling.
