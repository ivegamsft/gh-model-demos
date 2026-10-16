---
id: research-fan-out/bad
pattern: research-fan-out
variant: bad
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
  It spawns many "experts" with vague, overlapping briefs. Each searches broadly,
  including secondary blogs, and returns long reports. The lead agent rereads all
  of them before synthesizing.
expected_result: >
  High token use from duplicate searches and long worker reports. Sources are
  mixed in quality, and values may conflict or be unsourced. It is likely to fail
  the subagent-count and sourcing criteria.
---
Get a panel of 10 AI experts to each research everything about prompt
caching pricing for OpenAI, Anthropic, and Google, then combine all their
findings into a comprehensive report.
