---
id: plan-then-implement/good
pattern: plan-then-implement
variant: good
workload: multi-turn
interaction: interactive
config:
  surface: copilot-cli
  model_class: strong
  reasoning_effort: high
  tools: read-only
caps:
  max_ai_credits: 100
  timeout_minutes: 30
phases:
  - name: plan
    model_class: strong
    reasoning_effort: high
    tools: read-only
  - name: implement
    model_class: mid
    reasoning_effort: medium
    tools: default
fixtures:
  - fixtures/rate-limit-app/
acceptance:
  - Requests above 100 per minute per API key receive HTTP 429 with a Retry-After header
  - Requests within the limit are unaffected
  - New tests cover under-limit, over-limit, and window reset
  - Existing tests pass; no new dependencies
expected_processing: >
  Session 1 uses a strong model at high effort, read-only, to produce a short
  plan. Session 2 starts fresh with only the plan and uses a mid model at medium
  effort. Expensive reasoning is confined to the short planning phase.
expected_result: >
  A plan of 15 lines or fewer, then a scoped implementation. Compare total cost
  with the bad variant, which uses strong/high for the whole task.
---
Plan, do not implement. In fixtures/rate-limit-app/, design per-API-key rate
limiting: 100 requests per minute, HTTP 429 with Retry-After when exceeded.
Inspect the request pipeline and existing tests. Reuse existing middleware
patterns; no new dependencies.
Return a plan of at most 15 lines: files to change, approach, tests to add,
and risks. Stop after the plan.
<!-- session -->
Implement this plan in fixtures/rate-limit-app/:

{{previous_output}}

Follow the plan; if it is wrong, stop and explain rather than redesigning.
Run the focused tests and the existing suite. Report changed files and
results. Do not commit.
