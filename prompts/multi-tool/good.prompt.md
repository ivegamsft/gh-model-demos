---
id: multi-tool/good
pattern: multi-tool
variant: good
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
  Runs a narrow metrics query first, then dependent deployment and log checks with
  bounded output. Each result narrows the next query.
expected_result: >
  A concise, timestamped evidence table and one next step, with small tool results
  in context.
---
Investigate the staging API latency spike from 14:00-14:15 UTC on
2026-10-14. Read-only; no configuration changes or production access.
First query p95 latency and error rate for that exact service and window.
If confirmed, inspect the deployment active at the spike and retrieve
at most 20 relevant error records, excluding credentials and personal data.
Parallelize independent queries only; use each result to narrow later ones.
Return a timestamped evidence table, the leading explanation, and one
next diagnostic action. If a required tool is unavailable, identify the gap.
Stop when that report is complete.
