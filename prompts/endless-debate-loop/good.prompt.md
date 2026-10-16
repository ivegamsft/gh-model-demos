---
id: endless-debate-loop/good
pattern: endless-debate-loop
variant: good
workload: research
interaction: headless
config:
  surface: copilot-cli
  model_class: strong
  reasoning_effort: medium
  tools: read-only
caps:
  max_ai_credits: 50
  timeout_minutes: 15
fixtures:
  - fixtures/architecture/notifications-adr.md
acceptance:
  - Exactly three rounds, then stops
  - At most three material flaws, each tied to a stated requirement
  - No new preferences introduced as requirements
  - Ends with a decision, remaining risks, and a resolving experiment or decision owner for each
expected_processing: >
  Fixed review rounds with an explicit materiality bar and a final
  unresolved-risk assessment. History grows for three rounds only.
expected_result: >
  A finite decision record. Disagreement becomes an experiment or stakeholder
  decision rather than another round.
---
Review fixtures/architecture/notifications-adr.md against its stated
requirements.
Round 1: identify at most three material flaws, with evidence and impact.
Round 2: the proposer may revise once or explain why a flaw is not applicable.
Round 3: evaluate whether the material flaws were resolved.
Do not introduce new preferences as requirements.
Stop after round 3 even if disagreement remains.
Return the decision, remaining risks, and what experiment or stakeholder
decision would resolve each. If no material flaw is supported, say so.
