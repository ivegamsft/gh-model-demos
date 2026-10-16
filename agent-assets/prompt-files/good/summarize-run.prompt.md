---
name: summarize-run
description: Summarize one harness JSONL run file into a short cost table.
argument-hint: path to a run .jsonl file
agent: ask
tools: []
---

Summarize the run in ${input:runFile:path to run .jsonl}.

Return one table with these columns: config_id, runs, accepted, input tokens, cached tokens, output tokens, tokens per accepted completion. Include failed runs in totals. Do not estimate dollar cost.
