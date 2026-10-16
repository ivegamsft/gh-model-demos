---
id: code-review/bad
pattern: code-review
variant: bad
workload: agentic
interaction: headless
config:
  surface: copilot-cli
  model_class: mid
  reasoning_effort: medium
  tools: read-only
caps:
  max_ai_credits: 40
  timeout_minutes: 15
fixtures:
  - fixtures/review-diff/
acceptance:
  - Reports the seeded off-by-one bug with the correct file and line
  - Reports the seeded injection with the correct file and line
  - Two or fewer findings that are not seeded (false-positive budget)
  - No style-only findings
  - Five or fewer findings total
expected_processing: >
  Reads broadly beyond the diff and comments on style, naming, and possible
  refactors. It has no limit on findings.
expected_result: >
  A long list where the two seeded defects may be buried or missed. More output
  tokens and more reviewer time. On a PR-triggered reviewer, re-review rounds can
  surface new nitpicks each pass.
---
Review fixtures/review-diff/change.diff thoroughly and suggest any
improvements you can think of.
