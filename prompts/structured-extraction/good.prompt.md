---
id: structured-extraction/good
pattern: structured-extraction
variant: good
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
  Makes one model call with no tools. It maps text to the given schema and uses
  null for absent fields.
expected_result: >
  A compact JSON object with no surrounding prose. Output tokens are minimal and
  the result can be validated automatically.
---
Extract fields from the invoice below into JSON matching this schema exactly:

{
  "invoice_number": string,
  "issue_date": "YYYY-MM-DD",
  "vendor": string,
  "po_number": string | null,
  "currency": "ISO-4217 code",
  "line_items": [{ "description": string, "quantity": number, "unit_price": number }],
  "total": number
}

Rules: use null for any field not present; do not infer or calculate missing
values; copy numbers exactly. Return only the JSON, with no explanation.

Invoice:
Northwind Supplies — Invoice INV-20931
Issued: March 4, 2026
Bill to: Contoso Ltd.
2 x Ergonomic chair @ $489.00
1 x Standing desk frame @ $306.50
Total due: $1,284.50 USD
