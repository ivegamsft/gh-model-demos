---
id: design-debate/good
pattern: design-debate
variant: good
workload: research
interaction: interactive
config:
  surface: copilot-cli
  model_class: strong
  reasoning_effort: high
  tools: web
caps:
  max_ai_credits: 40
  timeout_minutes: 15
fixtures: []
acceptance:
  - Compares exactly the two named options against the stated constraints
  - Contains one critique and one revision, then stops
  - Labels assumptions; external price claims cite a primary source or are marked unverified
  - Ends with a recommendation and three or fewer unresolved risks
expected_processing: >
  Compares two options against explicit constraints, makes one adversarial pass,
  revises once, and decides. Web use is limited to price verification.
expected_result: >
  A decision table and recommendation with bounded length. Missing evidence is
  labeled rather than invented.
---
Compare a database-backed worker and a managed queue for notifications.
Constraints: 20,000 jobs/day, bursts of 50 jobs/second, at-least-once
delivery is acceptable, a two-person team, and no existing queue service.
Rank by operational burden, delivery guarantees, and estimated cost.
Label assumptions; cite current primary sources for external price claims.
Do one proposal, one adversarial critique, and one revision.
Return a decision table, a recommendation, and up to three unresolved risks.
Do not implement. Stop after the revision; consensus is not required.
