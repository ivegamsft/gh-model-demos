---
id: agent-loop/good
pattern: agent-loop
variant: good
workload: agentic
interaction: headless
config:
  surface: copilot-cli
  model_class: mid
  reasoning_effort: medium
  tools: default
caps:
  max_ai_credits: 80
  timeout_minutes: 20
fixtures:
  - fixtures/retry-regression/
acceptance:
  - The retry-timeout test passes without modification
  - No tests weakened, skipped, or deleted; no checks disabled
  - Three or fewer repair iterations
  - If unresolved, reports attempts, remaining failure, and missing evidence
expected_processing: >
  Reproduces the failure first, then tests distinct evidence-backed hypotheses
  within the iteration limit. It stops early if progress stalls.
expected_result: >
  Either a verified fix or a useful failure handoff with bounded attempts. Success
  is not guaranteed.
---
In fixtures/retry-regression/, fix the regression reproduced by the existing
retry-timeout test.
Run that test first. If it already passes, report that and do not guess a fix.
Loop: form an evidence-backed hypothesis, make the smallest relevant change,
then rerun the focused test and directly affected checks.
Allow at most three repair iterations or ten minutes, whichever comes first.
Do not weaken tests, disable checks, or change unrelated code.
After two iterations with the same failure and no new evidence, stop early.
On success, report the behavior restored. Otherwise report attempts,
remaining failure, and the specific missing evidence or decision.
