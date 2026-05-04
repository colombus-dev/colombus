---
description: "Workspace rules for reusable components, portable stories, and local-only Storybook validation."
applyTo: "**/*"
---

# Workspace Instructions

- Keep components reusable outside this prototype.
- Prefer generic theme tokens and shared CSS variables from `src/styles/theme.css`.
- Avoid prototype-specific CSS variables, colors, and hardcoded visual tokens when a shared variable exists.
- Keep component APIs explicit, small, and documented with stable prop names.
- Do not introduce implicit dependencies on another workspace, generated prototype structure, or local environment state.
- Use relative imports and project-local aliases only; do not use absolute Windows paths in code, config, or stories.
- Story data should live in local story fixtures and use reusable, generic examples.
- Validate portability by running the local Storybook build in this project before considering reuse or reintegration elsewhere.
- If a file is only a prototype bridge, isolate that coupling so reusable components stay decoupled.