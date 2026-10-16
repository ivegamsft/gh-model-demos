---
name: Caching
description: Prompt caching guidance.
applyTo: "**/*.{md,py,yaml,json,jsonl}"
---

Prompt caching stores a processed prefix so later requests that share it are cheaper and faster. Providers differ: some cache automatically, others need explicit breakpoints, and retention ranges from minutes to a day.

Changing the model, reasoning effort, or tool list mid-session invalidates the cache. Keep stable content first and variable content last. Avoid timestamps in system prompts. Long pauses can let the cache expire. Subagents with different models do not invalidate the main session's cache.

See also references/index.md for provider details.
