---
id: multi-tool/bad
pattern: multi-tool
variant: bad
workload: agentic
interaction: interactive
config:
  surface: copilot-cli
  model_class: mid
  reasoning_effort: medium
  tools: mock-observability   # metrics, deployments, logs (read-only mock MCP server)
caps:
  max_ai_credits: 60
  timeout_minutes: 20
fixtures:
  - fixtures/mock-observability/
acceptance:
  - Confirms the seeded spike window from metrics before other queries
  - Identifies the seeded deployment as the leading explanation, with timestamps
  - Retrieves 20 or fewer log records; no secrets or personal data in output
  - Distinguishes correlation from demonstrated cause
  - Proposes exactly one next diagnostic action
expected_processing: >
  Calls every tool broadly, pulls large log dumps into context, and repeats
  searches. It may try to "fix" things it cannot change.
expected_result: >
  High input tokens from oversized tool results and weak causal attribution. It
  may expose seeded sensitive records and likely fails the record-limit criterion.
---
Use the metrics, deployments, and logs tools to find everything wrong with
the staging service. Read all the results and fix it.
