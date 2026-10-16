---
id: endless-debate-loop/bad
pattern: endless-debate-loop
variant: bad
workload: research
interaction: headless
config:
  surface: copilot-cli
  model_class: strong
  reasoning_effort: medium
  tools: read-only
caps:
  max_ai_credits: 50   # REQUIRED: this prompt has no natural endpoint
  timeout_minutes: 15  # REQUIRED: stop the process if the credit cap is not enforced
fixtures:
  - fixtures/architecture/notifications-adr.md
acceptance:
  - Exactly three rounds, then stops
  - At most three material flaws, each tied to a stated requirement
  - No new preferences introduced as requirements
  - Ends with a decision, remaining risks, and a resolving experiment or decision owner for each
expected_processing: >
  Each response creates another challenge. History grows and is replayed every
  round. New objections may reflect novelty rather than material risk.
expected_result: >
  It runs until a cap is hit and has no accepted completion. Record it as capped,
  report total spend, and do not compute a cost-per-completion ratio. Cumulative
  input grows roughly quadratically with rounds until compaction or context limits
  intervene.
---
Using fixtures/architecture/notifications-adr.md:
Agent A: Propose the optimal architecture.
Agent B: Find a flaw in everything A says.
Agent A: Always revise to address B.
Repeat forever. Never accept that the design is finished.
