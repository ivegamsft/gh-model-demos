---
name: Usage data
description: Rules for recorded token-usage logs from harness runs. Use when reading, editing, or summarizing run usage files.
applyTo: "harness/results/**/*.jsonl"
---

- Treat usage logs as recorded evidence; never hand-edit token counts. Re-run instead.
- Keep provider field names as reported (for example `cached_tokens`, `cache_read_input_tokens`); normalize only in summary output.
- Summarize with `scripts/summarize_runs.py` from the `comparing-run-costs` skill instead of reading whole logs.
