---
id: structured-extraction/bad
pattern: structured-extraction
variant: bad
workload: single-task
interaction: interactive
config:
  surface: copilot-cli
  model_class: light
  reasoning_effort: low
  tools: none
caps:
  max_ai_credits: 10
  timeout_minutes: 5
fixtures: []
acceptance:
  - Output parses as JSON with exactly the schema keys
  - invoice_number is "INV-20931" and total is 1284.50
  - currency is "USD"
  - po_number is null because it is absent; the model does not invent one
  - line_items has 2 entries with correct quantities
expected_processing: >
  Makes one model call. It chooses its own structure and adds explanatory prose.
expected_result: >
  A readable but non-machine-parseable summary with more output tokens. It is
  likely to fail schema acceptance, which would require a second call to fix the
  format.
---
Pull out all the important info from this invoice and organize it nicely.
Explain what each part means.

Northwind Supplies — Invoice INV-20931
Issued: March 4, 2026
Bill to: Contoso Ltd.
2 x Ergonomic chair @ $489.00
1 x Standing desk frame @ $306.50
Total due: $1,284.50 USD
