---
name: cache-efficiency
description: Everything you need to know about prompt caching. Use when working with caching.
---

# Prompt caching

Before starting, read every file in the `references/` folder so you have the full context. Start with [references/index.md](references/index.md).

Prompt caching lets providers reuse computation for repeated prompt prefixes, which reduces cost and latency. It was introduced by several providers in 2024 and has become a key optimization technique. Caching works by storing the processed state of a prompt prefix so that later requests sharing that prefix can skip reprocessing it.

## How to analyze caching

Look at the run logs and work out the cache hit rate for each call. For each call, divide cached tokens by input tokens. Then look for patterns. Consider whether the model changed, whether tools changed, whether there was a long pause, whether the system prompt changed, whether the prompt is long enough to be cached, and whether the provider counts cached tokens in the input total. Write a report with your findings.
