---
id: one-shot/bad
pattern: one-shot
variant: bad
workload: single-task
interaction: interactive
config:
  surface: copilot-cli
  model_class: light
  reasoning_effort: low
  tools: none
caps:
  max_ai_credits: 10
  timeout_minutes: 5
fixtures: []
acceptance:
  - Exactly three bullets
  - Each bullet is 20 words or fewer
  - Preserves "2.4", "10,000 rows", and administrator disable control
  - Adds no facts not present in the source
expected_processing: >
  If tools are available, it may try to research writing advice. It generates
  multiple versions and revises without a measurable endpoint.
expected_result: >
  Longer output with several alternatives. The row limit or version may be
  dropped or embellished, so it often fails the shared acceptance bar.
---
Make these release notes better. Research best practices and give me lots of
versions. Think as hard as possible until the wording is perfect.

Version 2.4 adds CSV export for filtered results. Exports are limited to
10,000 rows. Administrators can disable export in workspace settings.
