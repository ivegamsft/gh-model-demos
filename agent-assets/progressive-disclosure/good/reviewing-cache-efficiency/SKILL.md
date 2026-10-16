---
name: reviewing-cache-efficiency
description: Diagnoses low prompt-cache hit rates in harness runs and recommends prefix changes. Use when cache reads are low, costs jump between similar runs, or the user asks why caching is not working. Not for general cost ranking; use comparing-run-costs for that.
compatibility: Requires Python 3.10+.
metadata:
  owner: gh-model-demos
  version: "1.0"
---

# Reviewing cache efficiency

1. Run `python scripts/cache_ratio.py <runs.jsonl>` to get the cache read ratio per call. Do not read the script.
2. Compare the ratio against the call sequence:
   - Low on the first call only: expected cold start.
   - Drops mid-session: a prefix change. Go to step 3.
   - Low throughout: the prefix may be below the provider's minimum cacheable length, or the provider reports cached tokens differently.
3. Load **only** the reference that matches the symptom:
   - Ratio drops after a model, effort, or tool change, or after a pause: [references/invalidation.md](references/invalidation.md)
   - Unsure which usage field holds cached tokens: [references/provider-fields.md](references/provider-fields.md)
4. Return the likely cause, the evidence (call numbers and ratios), and one prefix change to test.
