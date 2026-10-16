---
name: Usage data
description: Rules for token usage logs.
applyTo: "*.jsonl"
---

- Never hand-edit token counts.
- Keep provider field names as reported.
- Total cost = (input_tokens + cached_tokens) x input rate + output_tokens x output rate.
