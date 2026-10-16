---
id: agentic-task/good
pattern: agentic-task
variant: good
workload: agentic
interaction: interactive
config:
  surface: copilot-cli
  model_class: mid
  reasoning_effort: medium
  tools: default
caps:
  max_ai_credits: 100
  timeout_minutes: 30
fixtures:
  - fixtures/api-client/
acceptance:
  - Client accepts an optional timeout; default is 30 seconds
  - Existing callers that omit the option behave as before
  - Tests cover the default, a custom value, and timeout handling, and pass
  - No new dependencies; no unrelated API changes
  - No commit, push, or deploy
expected_processing: >
  Inspects the client and tests, reuses existing patterns, makes a small change,
  adds focused tests, and stops at acceptance. Uses a single agent.
expected_result: >
  A small, reviewable diff with passing focused tests, or a clear blocker instead
  of a false completion claim.
---
In fixtures/api-client/, add a configurable 30-second request timeout to the
existing API client.
First inspect the client and its current tests. Reuse its configuration
and error-reporting patterns. Preserve callers that omit the new option.
Add focused tests for the default, a custom timeout, and timeout handling.
Do not add dependencies or change unrelated APIs.
Use one agent unless a genuinely independent substantial task emerges.
Run the focused checks. Stop when acceptance criteria pass or a blocker
requires a product decision. Report changed files and remaining issues.
Do not commit, push, or deploy.
