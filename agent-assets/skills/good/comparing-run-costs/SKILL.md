---
name: comparing-run-costs
description: Compares token usage and cost per accepted completion across harness runs from JSONL run logs. Use when the user supplies run results or asks which model, effort level, or prompt variant was cheaper for the same task. Not for current pricing lookups or for writing prompts.
compatibility: Requires Python 3.10+. No network access needed.
metadata:
  owner: gh-model-demos
  version: "1.0"
---

# Comparing run costs

1. Run the summary script. Do not read the script; only its output is needed.

   ```bash
   python scripts/summarize_runs.py <runs.jsonl> --json
   ```

2. If the script exits with code 2, report the listed errors and stop. Do not repair the log by guessing values.
3. Rank only configurations whose runs share the same `task_id`. If they differ, say the runs are not comparable.
4. Report a table: configuration, runs, accepted, total input, cached input, output, and tokens per accepted completion.
5. Convert to dollars only if the user supplies rates with a source and date.

Read [references/metrics.md](references/metrics.md) only if a field's meaning is ambiguous, such as whether cached tokens are included in the input total.
