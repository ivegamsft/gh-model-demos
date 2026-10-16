# Stable-prefix classification batches

`tickets.jsonl` has exactly five lines. Each line is one array of five objects
`{id, text, gold_label}`. Strip `gold_label` before model input; retain it only
for grading. The guide contains the exact five allowed labels and tie-breaks.
Ticket identifiers are globally unique and preserve input order.

No npm application. From the repository root:
`node fixtures/generate.mjs --check` and
`node --test tests/fixtures.test.mjs`.
Regenerate with `node fixtures/generate.mjs`.
See the parent fixture README for actual tokenizer measurement commands.
The stable guide measures 1,563 `cl100k_base` tokens.
