---
id: headless-agentic/good
pattern: headless-agentic
variant: good
workload: agentic
interaction: headless
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
  Reads the CI log, locates the failing test, reproduces it once, and proposes a
  minimal patch. It returns machine-readable output and exits. There is no human
  to answer questions, so it reports a blocker instead of asking.
expected_result: >
  Compact JSON that a pipeline can parse and route to a human reviewer. Spend is
  bounded by both prompt endpoint and harness caps.
---
You are running unattended in CI. Nobody will answer questions.
Task: triage the failing build in fixtures/ci-failure/ using ci.log.
1. Identify the first failing test in ci.log.
2. Reproduce only that test once.
3. Find the root cause and propose the smallest fix as a unified diff.
Do not commit, push, or modify CI configuration. Do not fix other failures.
If you cannot establish the cause within these steps, stop and report blocked.
Return only this JSON:
{"status": "proposed" | "blocked", "failing_test": string,
 "root_cause": string, "evidence": [string], "patch": string | null,
 "reason_if_blocked": string | null}
