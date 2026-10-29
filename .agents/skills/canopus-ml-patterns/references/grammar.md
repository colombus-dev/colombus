# Canopus DSL — Grammar Reference

Source of truth: `https://github.com/colombus-dev/canopus-dsl/blob/main/ANTLR/CanopusDSL.g4`
(identical to the excerpt in Lacroix et al., "A Model-Driven Approach To Support The
Understanding Of Machine Learning Pipelines", JOT 2026, Listing 1).

## Full ANTLR grammar

```antlr
grammar CanopusDSL;

// ---------------------- Parser rules ----------------------

program: importPatterns* patternDef+ EOF;

importPatterns: 'import' ID (',' ID)*;

patternDef: 'pattern' ID '=' patternExpr;

// A pattern can contain multiple middleExpr and start with 'start' or end with 'end'
patternExpr:
    START_OP '->' middleExpr '->' END_OP
  | START_OP '->' middleExpr
  | middleExpr '->' END_OP
  | middleExpr;

// A middle expression is a sequence of multipExpr separated by ->
middleExpr: multipExpr ('->' multipExpr)*;

// A multiplicity expression is a primary expression with an optional multiplicity operator
multipExpr: primary multipOperator?;

// Primary (atomic) units of an expression
primary:
    '(' expr ('|' expr)+ ')'        # alternativeExpr
  | '[' condition (',' condition)* ']'  # elementExpr
  | ID                              # id
  | WILDCARD                        # wildcard;

// Multiplicity operator (like in regular expressions)
multipOperator: '*' | '+';

expr: primary ('->' primary)*;

// Conditions inside [...]
condition: LABEL comparator STRING;

comparator: '=' | '!=';

// ---------------------- Lexer rules ----------------------

START_OP: 'start';
END_OP: 'end';
ID: [A-Z][a-zA-Z0-9_]*;
LABEL: [a-z][a-zA-Z0-9_]*;
STRING: '"' (~["\r\n])* '"';
WS: [ \t\r\n]+ -> skip;
WILDCARD: '*';
COMMENT: '#' ~[\r\n]* -> skip;
```

## How to read this, element by element

- **A program** is zero or more `import` statements followed by one or more `pattern`
  definitions.
- **`pattern <ID> = <patternExpr>`** — the pattern's own name is an `ID`, i.e. it MUST
  start with an uppercase letter (`[A-Z][a-zA-Z0-9_]*`). `pattern dataAcq = ...` is
  invalid; `pattern DataAcq = ...` is valid.
- **Boundaries (`start`, `end`)** are optional, regex-anchor-style:
  - no boundary → the pattern can match anywhere inside a pipeline (like an unanchored
    regex search)
  - `start -> ...` → the pattern must match from the very first task of the pipeline
  - `... -> end` → the pattern must match through to the very last task
  - `start -> ... -> end` → the pattern must match the *entire* pipeline exactly
- **Sequencing (`->`)** chains elements in temporal order. `A -> B` means "A is
  immediately followed by B" *at that point in the chain* — but note the chain itself
  is just a flat list of `multipExpr`, there's no nesting beyond grouping/brackets.
- **Elements (`[cond, cond, ...]`)** are the atomic "match one pipeline task/step"
  building block. Conditions inside brackets are comma-separated and implicitly ANDed:
  `[step="Data Modeling", function="DMatrix"]` matches a task that is BOTH step=Data Modeling
  AND function=DMatrix.
  - `condition: LABEL comparator STRING` — the key (`LABEL`) MUST start with a
    **lowercase** letter (`[a-z][a-zA-Z0-9_]*`), and the value MUST be a
    **double-quoted string** literal (`STRING`). Single quotes are not valid STRING
    syntax.
  - `comparator` is only `=` or `!=`. There is no `<`, `>`, `contains`, regex-match,
    etc. — all conditions are **exact string equality or inequality** on whatever key
    a profiling function has attached to a task (commonly `step`, `function`, also
    seen: `library`). The set of valid keys is NOT fixed by the grammar; it's whatever
    description keys exist in the knowledge base being queried (see taxonomy.md for
    the step taxonomy this skill assumes by default).
- **Wildcard (`*`)** alone matches exactly one arbitrary task, of any description.
  It is NOT the same as the multiplicity operator `*` even though it's the same glyph
  — context disambiguates (primary `*` = "any one task"; `multipOperator *` directly
  after a primary = "zero or more of that primary"). Avoid stacking them
  (`**`, i.e. wildcard immediately followed by multiplicity-star) — the grammar
  comment itself flags this as an ambiguity to avoid ("TODO: remove wildcard from
  primary to avoid *+"). If you want "any number of arbitrary tasks," prefer
  `[step!="X"]*`-style negative conditions, or an explicit named wildcard element if
  your context supports it, and otherwise keep a bare `*` to mean "exactly one"
  intervening task and layer `->` `*` `->` repeatedly, or use the composed/bound
  patterns shown in examples.md (e.g. `InTheSmallFlex` in the paper literally chains
  `-> *` between each required step to mean "zero or more tasks" in practice via the
  convention established in that pattern — read examples.md before leaning on this).
- **Multiplicity (`*`, `+`)** attaches directly after a `primary` (an element, an ID
  reference, a wildcard, or a parenthesized alternation) to mean "zero or more" (`*`)
  or "one or more" (`+`) consecutive matches of that primary. There is no `?`
  (optional-single) operator in this grammar — model "optional" via `X*` (zero-or-one
  degenerates into zero-or-more here; see `Model Evaluation*` in the paper's
  `InTheSmallOptEval` pattern, used precisely to mean "Model Evaluation may or may not
  appear").
- **Grouping/disjunction `(A | B | C)`** — note the grammar requires **at least one**
  `|` inside the parens (`expr ('|' expr)+`), so a bare `(A)` with no alternation is
  NOT valid; use `A` directly instead. Each `expr` inside can itself be a `->`-chain
  of primaries (`expr: primary ('->' primary)*`), so `(A -> B | C)` is valid
  (alternating between "A then B" and "C").
- **Pattern composition** — any previously defined `pattern <ID> = ...` can be
  referenced by its `ID` as a `primary` inside a later pattern, exactly like an
  element. This is how the paper builds `SaveResults` out of `EndWithDataPrep`, and
  `ExamplePattern` out of a CSV-acquisition sub-pattern. Composed patterns can also
  take a multiplicity operator (`SomePattern*`) and participate in alternation.
- **`import <ID>, <ID>, ...`** — declares external pattern names to pull in (e.g. from
  another module/file of patterns) before referencing them. Use only when
  reusing a pattern that is not itself defined in the same program.
- **Comments** — `# ...` to end of line, skipped by the lexer. Use freely to document
  intent inline; comments are never required but are good practice for rationale
  breadcrumbs in longer, composed patterns.
- **Whitespace** is insignificant (skipped by the lexer) — format multi-line patterns
  for readability exactly like the paper does, with `->` starting each continuation
  line.

## Quick validity checklist (apply before presenting any pattern)

1. Does every `pattern` name start with an uppercase letter and use only
   `[a-zA-Z0-9_]` after that?
2. Does every condition key (`step`, `function`, `library`, ...) start with a
   lowercase letter, with only `[a-zA-Z0-9_]` after that?
3. Is every condition value a double-quoted string (`"..."`), never bare/unquoted,
   never single-quoted?
4. Is the comparator only `=` or `!=`?
5. Are brackets `[...]` only used around comma-separated conditions (never around a
   bare `->`-chain — that's what bare sequencing or parens are for)?
6. Are parens `(...)` only used with at least one `|` inside?
7. Is `*` or `+` only ever placed directly after a single primary (an `[...]`
   element, an `ID` pattern reference, a wildcard `*`, or a `(...)` group) — never
   after a `->`-chain as a whole, never doubled-up ambiguously?
8. If `start`/`end` are used, are they only at the very beginning/end of the
   top-level `patternExpr`, connected with `->`, never in the middle of a chain?
9. If the pattern reuses another pattern's `ID`, is that other pattern defined
   earlier in the same program (or declared via `import`)?
10. Does the whole thing parse as exactly one `patternDef` per `pattern` keyword —
    no stray `=`, no missing `->` between consecutive elements?
