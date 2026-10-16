---
name: Prompt library
description: Format rules for paired good/bad prompt files. Use when creating or editing prompts in the prompt library.
applyTo: "prompts/**/*.prompt.md"
---

- Good and bad variants of a pattern share `config`, `caps`, `fixtures`, and `acceptance` unless the pattern compares workflows.
- `expected_processing` and `expected_result` are hypotheses; do not state them as measured.
- Bad variants must set caps; agentic bad variants set `run_safety: sandbox-only`.
