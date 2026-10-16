---
id: agentic-task/bad
pattern: agentic-task
variant: bad
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
  Explores the whole repository, makes subjective improvements, and may fan out to
  agents and repeat review-and-fix cycles. It has no objective completion point.
expected_result: >
  A large diff that is hard to review. The timeout may or may not be added, and
  unrelated changes violate acceptance. It is likely to hit the credit cap.
---
Improve fixtures/api-client/. Use as many agents as needed, fix anything you
find, and keep working until everything is production-ready.
