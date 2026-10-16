---
id: headless-agentic/bad
pattern: headless-agentic
variant: bad
workload: agentic
interaction: headless
run_safety: sandbox-only
config:
  surface: copilot-cli   # non-interactive: -p, --no-ask-user
  model_class: mid
  reasoning_effort: medium
  tools: read-only+shell-test   # read files and run the test command; no git push
caps:
  max_ai_credits: 80
  timeout_minutes: 20
fixtures:
  - fixtures/ci-failure/
acceptance:
  - Output is a single JSON object matching the requested schema
  - root_cause names the seeded defect and file
  - patch is a unified diff that makes the failing test pass when applied
  - status is "blocked" with a reason if the cause cannot be established
  - No pushes, commits, or edits outside the working copy
expected_processing: >
  Runs the full suite repeatedly and attempts fixes across many failures. It may
  try to ask questions that nobody will answer, then continue on assumptions.
expected_result: >
  Unstructured prose that a pipeline cannot route. It runs until a cap is hit.
  Each CI trigger multiplies this cost.
---
The build in fixtures/ci-failure/ is failing. Fix the build.
