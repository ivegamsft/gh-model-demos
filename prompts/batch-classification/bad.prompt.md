---
id: batch-classification/bad
pattern: batch-classification
variant: bad
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
  A changing timestamp starts the prompt, so the otherwise identical label guide
  cannot be reused as a cached prefix. Free-form reasoning increases output.
expected_result: >
  Few or no cache reads across repetitions and more output tokens. Labels drift
  outside the allowed set or arrive as prose, failing automated grading.
---
Current time: {{now}}

Here is our label guide:
{{file:fixtures/batch-classification/label-guide.md}}

Here are some tickets. What's going on with each one? Tell me how you'd
categorize them and why.

{{batch}}
