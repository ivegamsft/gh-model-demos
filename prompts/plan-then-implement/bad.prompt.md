---
id: plan-then-implement/bad
pattern: plan-then-implement
variant: bad
workload: multi-turn
interaction: interactive
config:
  surface: copilot-cli
  model_class: strong
  reasoning_effort: high
  tools: default
caps:
  max_ai_credits: 100
  timeout_minutes: 30
fixtures:
  - fixtures/rate-limit-app/
acceptance:
  - Requests above 100 per minute per API key receive HTTP 429 with a Retry-After header
  - Requests within the limit are unaffected
  - New tests cover under-limit, over-limit, and window reset
  - Existing tests pass; no new dependencies
expected_processing: >
  A single session on a strong model at high effort mixes exploration, design,
  and implementation. Exploration output stays in context for every
  implementation step.
expected_result: >
  Likely a working result, but at strong/high rates for routine edits and with a
  larger replayed context. The point is cost per accepted result, not whether it
  works.
---
Add rate limiting to fixtures/rate-limit-app/. Figure out the best approach
and build it. Make it robust.
