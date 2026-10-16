# Docs: reducing AI model and token cost

These are fact-checked guides on lowering **cost per accepted completion**. Product and pricing claims reflect the sources cited in each doc, as of October 2026, and may change.

## Suggested reading order

1. [Lower token cost per completed workflow](model-usage-cost-optimization.md): the levers, ranked from easiest to most complex.
2. [AI workloads and cost](ai-workloads-cost.md): why workload shape matters more than the price of a single call.
3. [Prompt caching](prompt-caching-guidance.md): how to make repeated context cheap.
4. [Harnesses, effort, and prompt patterns](harnesses-and-effort.md): VS Code, the CLI, cloud agents, and effort/thinking settings.
5. [Model selection, routers, and execution shapes](model-selection-and-execution-shapes.md): Auto, manual routing, third-party routing, and Foundry routing; cascades and ensembles.
6. [Frontmatter and scripts](frontmatter-and-scripts.md): designing skills, agents, instructions, and prompts for low context cost.

## Table of contents

### [Lower token cost per completed workflow](model-usage-cost-optimization.md)
- [Executive assessment](model-usage-cost-optimization.md#executive-assessment)
- [Recommended adoption order](model-usage-cost-optimization.md#1-recommended-adoption-order)
- [Fact-check and debate](model-usage-cost-optimization.md#2-fact-check-and-debate)
- [Measurement plan](model-usage-cost-optimization.md#3-measurement-plan-for-the-demo-repository)
- [Presenter challenge sheet](model-usage-cost-optimization.md#4-presenter-challenge-sheet)

### [AI workloads and cost](ai-workloads-cost.md)
- [Main conclusion](ai-workloads-cost.md#main-conclusion)
- [Shared cost model](ai-workloads-cost.md#1-shared-cost-model)
- [Comparison](ai-workloads-cost.md#2-comparison)
- [Single task](ai-workloads-cost.md#3-single-task-one-shot) · [Multi-turn](ai-workloads-cost.md#4-multi-turn) · [Research](ai-workloads-cost.md#5-research-debate-ensemble-fan-out) · [Agentic](ai-workloads-cost.md#6-agentic-headless) · [Orchestration](ai-workloads-cost.md#7-orchestration)
- [Effort and harness by workload](ai-workloads-cost.md#8-effort-and-harness-by-workload)
- [Measuring workloads in the harness](ai-workloads-cost.md#9-measuring-workloads-in-the-harness)

### [Prompt caching](prompt-caching-guidance.md)
- [Core principle](prompt-caching-guidance.md#core-principle)
- [Fact-check of the slide](prompt-caching-guidance.md#fact-check-of-the-slide)
- [Recommended conceptual layout](prompt-caching-guidance.md#recommended-conceptual-layout)
- [Provider differences](prompt-caching-guidance.md#provider-differences)
- [Illustrative savings calculation](prompt-caching-guidance.md#illustrative-savings-calculation)
- [Optimization when you control the API](prompt-caching-guidance.md#optimization-when-you-control-the-api) · [when using Copilot](prompt-caching-guidance.md#optimization-when-using-copilot)
- [Measurement checklist](prompt-caching-guidance.md#measurement-checklist)

### [Harnesses, effort, and prompt patterns](harnesses-and-effort.md)
- [Where the cost comes from](harnesses-and-effort.md#1-where-the-cost-comes-from)
- [Harness comparison](harnesses-and-effort.md#2-harness-comparison)
- [Effort, thinking, routing, and verbosity are different](harnesses-and-effort.md#3-effort-thinking-routing-and-verbosity-are-different)
- [Prompt patterns](harnesses-and-effort.md#4-prompt-patterns)
- [What to measure in a demo](harnesses-and-effort.md#5-what-to-measure-in-a-demo)

### [Model selection, routers, and execution shapes](model-selection-and-execution-shapes.md)
- [Summary](model-selection-and-execution-shapes.md#summary)
- [Manual model and Auto](model-selection-and-execution-shapes.md#slide-1-manual-model-and-auto)
- [Manual, third-party, and Foundry routers](model-selection-and-execution-shapes.md#beyond-copilot-auto-manual-third-party-and-foundry-routers)
- [Execution shapes](model-selection-and-execution-shapes.md#slide-2-execution-shapes)
- [Presenter challenges](model-selection-and-execution-shapes.md#presenter-challenges)

### [Frontmatter and scripts](frontmatter-and-scripts.md)
- [Where each part lands in context](frontmatter-and-scripts.md#1-where-each-part-lands-in-context)
- [Frontmatter fields by file type](frontmatter-and-scripts.md#2-frontmatter-fields-by-file-type)
- [Good and bad frontmatter](frontmatter-and-scripts.md#3-good-and-bad-frontmatter)
- [Adding scripts](frontmatter-and-scripts.md#4-adding-scripts)
- Effects on [caching](frontmatter-and-scripts.md#5-how-design-choices-affect-caching), [cost](frontmatter-and-scripts.md#6-how-design-choices-affect-cost), and [task outcomes](frontmatter-and-scripts.md#7-how-design-choices-affect-task-outcomes)
- [Design checklist](frontmatter-and-scripts.md#9-design-checklist)

## Concept index

| Concept | Where it is explained | Diagram |
|---|---|---|
| Cost per accepted completion | [Workloads: shared cost model](ai-workloads-cost.md#1-shared-cost-model) | — |
| Cost levers ranked by effort vs savings | [Adoption order](model-usage-cost-optimization.md#1-recommended-adoption-order) | [Quadrant](diagrams/cost-levers-quadrant.svg) |
| Prompt caching and the exact-prefix rule | [Caching: core principle](prompt-caching-guidance.md#core-principle) | [Layer stack](diagrams/prompt-cache-layers.svg) |
| Quadratic multi-turn growth | [Workloads: multi-turn](ai-workloads-cost.md#4-multi-turn) | [Line chart](diagrams/multi-turn-cache-growth.svg) |
| Agent and multi-agent token multipliers | [Workloads: main conclusion](ai-workloads-cost.md#main-conclusion) | [Bar chart](diagrams/workload-token-multipliers.svg) |
| Debate, ensembles, and fan-out | [Workloads: research](ai-workloads-cost.md#5-research-debate-ensemble-fan-out) | — |
| Stopping rules for headless agents | [Workloads: agentic](ai-workloads-cost.md#6-agentic-headless) | — |
| Harness differences (VS Code, CLI, cloud agent) | [Harness comparison](harnesses-and-effort.md#2-harness-comparison) | — |
| Effort, thinking, and verbosity settings | [Effort vs thinking](harnesses-and-effort.md#3-effort-thinking-routing-and-verbosity-are-different) | — |
| The five layers of "routing" | [Routing layers](model-selection-and-execution-shapes.md#separate-the-routing-layers) | [Layer stack](diagrams/routing-layers.svg) |
| Microsoft Foundry Model Router | [Foundry Model Router](model-selection-and-execution-shapes.md#microsoft-foundry-model-router) | [Flowchart](diagrams/foundry-model-router-flow.svg) |
| Cascades (cheap first, escalate on failure) | [Cascade](model-selection-and-execution-shapes.md#cascade) | [Flowchart](diagrams/cascade-flow.svg) |
| Progressive disclosure in skills | [Where each part lands](frontmatter-and-scripts.md#1-where-each-part-lands-in-context) | [Pyramid](diagrams/progressive-disclosure-pyramid.svg) |
| `applyTo` globs and frontmatter design | [Frontmatter fields](frontmatter-and-scripts.md#2-frontmatter-fields-by-file-type) | — |
| Scripts instead of model reasoning | [Adding scripts](frontmatter-and-scripts.md#4-adding-scripts) | — |

## Diagrams

All diagrams live in [`diagrams/`](diagrams/README.md) and are generated by a single script. That README covers the sources, style, and how to regenerate them.

## Related

- [Prompt library](../prompts/README.md): good and bad prompts for each pattern
- [Agent assets](../agent-assets/README.md): good and bad skills, agents, and instructions
- [Test harness](../tests/README.md): measures the good and bad variants
