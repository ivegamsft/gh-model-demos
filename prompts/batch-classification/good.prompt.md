---
id: batch-classification/good
pattern: batch-classification
variant: good
workload: single-task
interaction: headless
config:
  surface: copilot-cli
  model_class: light
  reasoning_effort: low
  tools: none
caps:
  max_ai_credits: 30
  timeout_minutes: 5
repetitions: 5
fixtures:
  - fixtures/batch-classification/label-guide.md
  - fixtures/batch-classification/tickets.jsonl
acceptance:
  - One JSONL line per ticket, in input order
  - Every label is from the allowed set
  - Labels match the gold labels in tickets.jsonl
expected_processing: >
  The stable instructions and label guide come first, and the changing batch comes
  last. Repetitions 2..N should reuse the cached prefix while it remains within the
  cache lifetime. Output is short labels only.
expected_result: >
  Compact JSONL. Warm repetitions should report cache-read tokens for roughly the
  instruction-plus-guide prefix.
---
You are a support-ticket classifier.
Allowed labels: billing, bug, how-to, account, feature-request.
For each ticket return one JSON line: {"id": <id>, "label": "<label>"}.
Use exactly one allowed label. Do not explain. Preserve input order.

Label guide:
{{file:fixtures/batch-classification/label-guide.md}}

Tickets:
{{batch}}
