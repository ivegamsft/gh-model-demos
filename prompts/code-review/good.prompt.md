---
id: code-review/good
pattern: code-review
variant: good
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
  Reads the diff and only the surrounding code needed to confirm each issue.
  Applies a correctness/security bar and stops at five findings.
expected_result: >
  A short list of high-signal findings with locations, or "No material issues
  found." Low output, and every finding is actionable.
---
Review the diff in fixtures/review-diff/change.diff for correctness and
security defects only. Read surrounding code only where needed to confirm
an issue. Ignore style, naming, and formatting.
Report at most five findings, highest severity first. For each give:
severity (high/medium/low), file:line, the defect, and why it is a defect.
Only report issues you can justify from the code. If there are none, return
exactly "No material issues found."
