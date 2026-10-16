---
id: rag/bad
pattern: rag
variant: bad
workload: single-task
interaction: interactive
config:
  surface: copilot-cli
  model_class: mid
  reasoning_effort: medium
  tools: read-only
caps:
  max_ai_credits: 30
  timeout_minutes: 10
fixtures:
  - fixtures/rag/policies/
acceptance:
  - Uses the US annual policy effective on 2026-10-01, not the superseded or non-US version
  - Cites document ID, section, and effective date
  - Does not fill gaps from general knowledge
  - Abstains with the required sentence if evidence is insufficient
expected_processing: >
  Reads every document in the corpus, or picks one arbitrarily, then completes
  gaps from general knowledge.
expected_result: >
  Higher input tokens and a plausible but possibly wrong answer, for example one
  based on the superseded or non-US policy, without citations.
---
Read everything in fixtures/rag/policies/ and tell me our current refund
policy. If the answer is missing, use what companies normally do.
