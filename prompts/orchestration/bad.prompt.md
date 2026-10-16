---
id: orchestration/bad
pattern: orchestration
variant: bad
workload: orchestration
interaction: headless
run_safety: sandbox-only
config:
  surface: copilot-cli
  model_class: strong          # orchestrator
  reasoning_effort: medium
  tools: default
  subagent_model_class: light  # workers
  subagent_mechanism: subagents-or-fleet   # record which was used
caps:
  max_ai_credits: 200
  timeout_minutes: 45
fixtures:
  - fixtures/deprecated-api/
acceptance:
  - All deprecated calls in the three modules are replaced
  - The shared utility is changed once, not by multiple workers
  - Full test suite passes after the final merge
  - Three or fewer workers; no overlapping file sets
  - No unrelated changes
expected_processing: >
  Spawns one agent per file with vague briefs. Several workers edit the shared
  utility. Cross-review multiplies calls, and every worker loads the full context.
expected_result: >
  Conflicting edits, duplicated context, and coordination churn. Total tokens are
  much higher than the single-agent baseline. It may hit the cap before the suite
  passes.
---
Use fleet mode. Spin up an agent for every file in fixtures/deprecated-api/
to modernize the codebase, then have each agent review the others' work
until everyone is satisfied.
