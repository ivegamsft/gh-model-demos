---
id: long-context-summarization/bad
pattern: long-context-summarization
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
  - fixtures/long-context/design-doc.md
acceptance:
  - Identifies all three seeded decisions with correct section numbers
  - Lists open risks only if stated in the document
  - 250 words or fewer
  - No claims absent from the document
expected_processing: >
  Reads the document and may explore surrounding files for context. It produces a
  section-by-section summary with no length bound.
expected_result: >
  Long output that restates much of the input, with decisions buried. It likely
  exceeds the word limit and may add outside commentary.
---
Summarize everything in fixtures/long-context/design-doc.md in detail.
Don't leave anything out, and add your own thoughts on it.
