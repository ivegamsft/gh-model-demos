---
id: one-shot/good
pattern: one-shot
variant: good
workload: single-task
interaction: interactive
config:
  surface: copilot-cli
  model_class: light
  reasoning_effort: low
  tools: none
caps:
  max_ai_credits: 30
  timeout_minutes: 5
fixtures: []
acceptance:
  - Exactly three bullets
  - Each bullet is 20 words or fewer
  - Preserves "2.4", "10,000 rows", and administrator disable control
  - Adds no facts not present in the source
expected_processing: >
  Transforms the supplied text and checks the explicit constraints. Ordinarily it
  makes no tool calls and one model call.
expected_result: >
  Three short bullets covering CSV export, the row limit, and administrator
  control. Output is small and stable across runs.
---
Rewrite the following release notes for end users.
Return exactly three bullets, each at most 20 words.
Preserve the version number and every stated limitation. Add no facts.
Use only the supplied text; no tools or research are needed.
Return only the three bullets.

Source:
Version 2.4 adds CSV export for filtered results. Exports are limited to
10,000 rows. Administrators can disable export in workspace settings.
