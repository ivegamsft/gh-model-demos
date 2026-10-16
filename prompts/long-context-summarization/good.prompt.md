---
id: long-context-summarization/good
pattern: long-context-summarization
variant: good
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
  Reads the single named file once, answers targeted questions, and cites
  sections. Input cost is dominated by the document; output is bounded.
expected_result: >
  A short decision brief with section citations, suitable for automated grading
  against the seeded decisions.
---
Read fixtures/long-context/design-doc.md. Do not open other files.
Answer for an engineering manager who has not read it:
1. What three decisions does the document make? Cite section numbers.
2. What risks does the document itself call out as open?
3. What, if anything, is explicitly deferred?
Use at most 250 words. Use only the document; if something is not stated,
say "not stated". Return the answer only.
