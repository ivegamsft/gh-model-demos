---
id: research-fan-out/good
pattern: research-fan-out
variant: good
workload: research
interaction: interactive
config:
  surface: copilot-cli
  model_class: strong
  reasoning_effort: medium
  tools: web
  subagent_model_class: light
caps:
  max_ai_credits: 150
  timeout_minutes: 30
fixtures: []
acceptance:
  - Covers OpenAI, Anthropic, and Google
  - For each provider, gives cache write multiplier, read multiplier, and default lifetime, or marks the value "not published"
  - Every value cites a primary provider documentation URL
  - No duplicate subagent work; three or fewer subagents
  - Final table plus 150 words or fewer of commentary
expected_processing: >
  The lead agent splits the question into three independent provider lookups. It
  delegates each to a light-model worker with a narrow brief and output format,
  then deduplicates and synthesizes once.
expected_result: >
  A sourced comparison table. Parallel workers run in separate contexts and
  return compressed findings, so the lead context stays small.
---
Research question: compare current published prompt-caching pricing for
OpenAI, Anthropic, and Google model APIs.

Plan: this is a breadth-first comparison of three independent sources.
Use at most three subagents, one per provider, on a light model.
Give each subagent this brief:
  - Objective: find the provider's official prompt-caching pricing page.
  - Return: write-price multiplier vs ordinary input, read-price multiplier,
    default cache lifetime, and minimum cacheable length, each with the
    source URL. Use "not published" when absent; do not estimate.
  - Limits: official provider documentation only; at most 8 tool calls;
    at most 150 words.
Do not search yourself while subagents run. After they return, check for
conflicts, then produce one table with sources and at most 150 words of
commentary. Stop.
