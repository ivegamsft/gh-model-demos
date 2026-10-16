---
id: design-debate/bad
pattern: design-debate
variant: bad
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
  Expands alternatives, role-plays several personas, and repeats objections. It
  may spawn subagents and search broadly. Without stated constraints, "best" has
  no definition.
expected_result: >
  A long discussion that is likely to hit the credit cap or end without a
  defensible decision. It fails the shared acceptance bar because the constraints
  were never supplied.
---
Design the best notification architecture. Have five experts debate all
possible architectures. Keep challenging each other until everyone agrees.
