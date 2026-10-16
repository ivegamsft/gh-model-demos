---
name: Harness Python
description: Conventions for the cost harness runner and metric scripts. Use when writing or editing harness Python code.
applyTo: "harness/**/*.py"
---

- Read provider usage fields as reported; do not add cached tokens to input unless the provider reports them separately.
- Scripts print bounded, deterministic output and exit non-zero with an actionable message on invalid input.
- Never log prompts, secrets, or full responses by default; use `--verbose`.
- Run `python -m pytest harness/tests` after changes.
