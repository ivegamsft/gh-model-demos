---
name: Run config caching
description: Cache impact of harness run configuration. Use when changing model, reasoning effort, or tool settings for a run.
applyTo: "harness/configs/**/*.yaml"
---

Changing `model`, `reasoning_effort`, or `tools` mid-session invalidates the prompt cache. Set them per session, not per turn.

For causes and fixes, load [invalidation.md](../reviewing-cache-efficiency/references/invalidation.md) only if a run shows a cache-ratio drop.
