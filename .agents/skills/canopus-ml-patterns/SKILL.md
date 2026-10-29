---
name: canopus-ml-patterns
description: Write Canopus DSL patterns for analyzing ML pipelines — detecting good practices and anti-patterns (data contamination, pipeline jungles, missing evaluation, order-sensitive preprocessing bugs, fairness-compliance checks, feedback loops, etc.) and explaining the ML-practice rationale behind them. Use this skill whenever the user mentions Canopus, Canopus DSL, Colombus, or asks to write/review/debug/explain a pattern over ML pipelines/notebooks — and also whenever the user describes wanting to detect an ML pipeline practice or anti-pattern structurally (sequencing of pipeline steps, specific library/function usage, data leakage, tangled or jungled stages, compliance with a reference pipeline), even if they don't name Canopus explicitly. Always produces two things together (1) a syntactically valid Canopus pattern, and (2) a concise rationale explaining what ML knowledge the pattern captures and what an ML expert would learn from a match.
---

# Canopus DSL Pattern Writer

Canopus is a small, regex-like DSL (introduced in Lacroix et al., JOT 2026, "A
Model-Driven Approach To Support The Understanding Of Machine Learning Pipelines")
for matching structural+semantic motifs over `DescriptiveMLPipeline` models — i.e.
sequences of pipeline tasks (steps like Data Collection, Data Modeling...)
annotated with code-derived descriptions (`function=`, `library=`, etc.). It's used
to detect good practices, anti-patterns, and compliance deviations across corpora of
ML pipelines (e.g. Kaggle notebooks).

Grammar reference (ANTLR, canonical):
`https://github.com/colombus-dev/canopus-dsl/blob/main/ANTLR/CanopusDSL.g4`
Paper: `https://www.jot.fm/issues/issue_2026_03/a10.pdf`

**Every request this skill handles should produce two deliverables together:**
1. A **Canopus pattern** (or small set of related patterns) — syntactically valid
   per the grammar.
2. A **concise rationale** — what ML knowledge/practice this captures, why it
   indicates good practice or an anti-pattern, and what an ML expert would learn from
   a match (or from the absence of matches across a corpus).

Never produce just the pattern without the rationale, and never produce a vague
rationale without a concrete pattern — the two are the point of this skill together.

## Workflow

### 1. Understand what practice/anti-pattern is being targeted

Before writing anything, make sure you know:
- **What behavior is being captured?** A good/bad practice, a compliance target, a
  structural filter, a taxonomy/profiling-function audit, a feedback loop, etc.
- **Is it already well-specified** by the user (e.g. "detect models retrained after
  seeing evaluation data") or does it need a bit of interpretation? If reasonably
  clear, proceed with a stated assumption rather than stopping to ask. Only ask a
  clarifying question when the request is genuinely ambiguous in a way that would
  change the pattern's shape (e.g. "detect bad preprocessing order" — which
  algorithm family makes the order matter? see references/examples.md's note on
  order-sensitive preprocessing).
- **Which taxonomy/vocabulary** applies. Default to the taxonomy in
  `references/taxonomy.md` (the 6-stage "in-the-small" set: Data Acquisition, Data
  Preparation, Data Modeling, Model Deployment, Model Evaluation — exactly what the paper's
  own examples use) unless the user specifies their own step categories, function
  names, or library names. If they mention a custom/internal taxonomy, use theirs
  and say so.

### 2. Read the grammar reference before writing

Before drafting, consult `references/grammar.md` for the full ANTLR grammar, a
plain-English walkthrough of every construct, and a 10-point validity checklist.
This matters even for syntax you think you remember — Canopus has a few easy-to-miss
quirks (e.g. `(A)` alone without `|` is invalid; there's no `?` operator, only `*`/
`+`; condition keys are lowercase-first, pattern names are uppercase-first; `*` as
wildcard vs. `*` as multiplicity depends on position).

### 3. Draft the pattern

Use `references/examples.md` Part 1 for syntax/style precedent — it contains every
worked pattern from the paper's evaluation (filters, boundary assertions, negative
conditions, multiplicity, grouping, composition, feedback-loop detection, pipeline
jungle detection, contamination detection, taxonomy auditing). Favor matching the
paper's formatting style: one `->`-segment per line for multi-line patterns, `[...]`
elements indented consistently.

Guidelines on complexity:
- Keep patterns **as simple as the request allows**. A single `[step="X"]` filter is
  a complete, legitimate answer when that's what's being asked (don't add boundaries,
  wildcards, or composition the user didn't need).
- Use **composition** (reusing a previously defined `pattern <ID>` inside a new one)
  when it mirrors how the user is thinking about the problem iteratively (coarse
  pattern first, refined pattern built on top) — this is a first-class, idiomatic
  Canopus technique, not just a convenience.
- Use **negative conditions** (`!=`) and **wildcards with multiplicity** (`*`/`+`)
  to express "anything in between" or "except this" — this is how the paper expresses
  realistic, relaxed pipelines rather than brittle exact-match ones (see
  `InTheSmallFlex` vs `InTheSmall` in examples.md for the contrast, and why the exact
  version matched nothing).
- When the target concept genuinely has two shapes (e.g. "either immediately retrains
  or evaluates-then-retrains"), use `(A | B)` grouping.
- Name patterns descriptively in `PascalCase`-ish `ID` form matching the concept
  (`PipelineJungle`, `Contamination`, `FairnessCheckNnabla`), not generically
  (`Pattern1`).

### 4. Validate before presenting

Run the pattern mentally against the 10-point checklist in `references/grammar.md`
("Quick validity checklist"). If this environment has an actual Canopus/Colombus
grammar-validation tool, linter, or connector available (check connected tools/MCP
servers before assuming none exists), use it to confirm the pattern parses rather
than relying solely on manual review. If no such tool is available, say so is not
necessary — just do the manual checklist carefully and don't claim machine-validated
correctness you don't have.

### 5. Write the rationale

Structure the rationale around these questions (doesn't need rigid headers for a
short answer, but should clearly address each):
- **What is this pattern looking for**, in plain language (translate the DSL back
  into a sentence a non-DSL-reading ML expert would understand)?
- **What knowledge does it capture?** Tie it to a concrete, named ML practice or
  anti-pattern concept where applicable — draw on `references/examples.md` Part 2
  (data leakage/contamination, CACE principle, pipeline jungles, tangled stages,
  missing evaluation, order-sensitive preprocessing, feedback loops, fairness
  compliance, taxonomy/profiling-function auditing) and Part 3 (algorithm ↔
  preprocessing compatibility: when a transformation like scaling, one-hot encoding,
  imputation, or dimensionality reduction is necessary, redundant-but-harmless, or
  redundant-and-harmful for a given downstream estimator family). Don't force a
  citation to a named concept if the pattern is a simpler structural filter that
  doesn't need one. For algorithm/function-pairing requests specifically, check Part
  3's compatibility table first and name which of its three flavors
  (unnecessary-but-harmless / unnecessary-and-harmful / missing-and-necessary) the
  pattern targets — the "what should the user do about it" advice differs by flavor.
- **What would an ML expert learn from a match (or from no matches / an unexpectedly
  low or high match rate across a corpus)?** Be concrete: "a match here means the
  model was retrained after the evaluation step without an intervening fresh split —
  worth inspecting that notebook's test/train isolation," not vague hand-waving.
- **Caveats/conditionality, when relevant**: some anti-patterns are
  algorithm-specific or context-dependent (see the scaling-vs-outlier-removal and
  missing-value-handling examples) — say so rather than presenting a conditional
  anti-pattern as a universal rule. This is exactly the UC3 "iterative refinement"
  spirit of the paper: a structural match is a *lead to investigate*, not
  automatically a verdict.

### 6. Output format

Present the pattern(s) in a fenced code block (use `canopus` as the language tag if
the renderer supports arbitrary tags, otherwise plain text) followed by the rationale
as prose. For multiple related patterns (e.g. a coarse pattern plus a refined one
built via composition), show them together in one block, in defined order, exactly
as the paper does. Default to replying inline in the conversation — this is normally
a short, read-once artifact; only create a saved file if the user asks to keep/export
it or is clearly building a reusable pattern library across many turns.

## When the request is about reviewing/debugging an existing pattern

Apply the same `references/grammar.md` checklist to find the issue, explain which
rule is violated in plain language (don't just say "invalid," point at the specific
construct and the specific grammar rule), then show the corrected pattern. If the
pattern is syntactically valid but semantically questionable (e.g. a condition key
that doesn't match the taxonomy being used, or a boundary assertion that
contradicts the user's stated intent), flag that too.

## Reference files

- `references/grammar.md` — full ANTLR grammar, construct-by-construct walkthrough,
  10-point validity checklist. Read before drafting any pattern.
- `references/taxonomy.md` — default `step=` vocabulary (11-stage "in theory" and
  6-stage "in-the-small" taxonomies from Biswas et al. 2022, as used by the paper),
  plus other common condition keys (`function=`, `library=`) and how they relate.
- `references/examples.md` — Part 1: every worked pattern from the paper's
  evaluation, for syntax/style precedent. Part 2: a domain-knowledge bank (data
  leakage, CACE, pipeline jungles, order-sensitive preprocessing, feedback loops,
  fairness compliance, taxonomy auditing) for grounding rationale explanations.
  Part 3: algorithm ↔ preprocessing (in)compatibility knowledge (scaling/encoding/
  imputation/dimensionality-reduction vs. estimator family — e.g. one-hot encoding
  before a tree ensemble) with a compatibility table and worked patterns, for
  requests about specific function/library pairings.
