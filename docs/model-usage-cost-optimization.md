# Lower Token Cost per Completed Workflow

Slide review, ranked adoption sequence, fact-check, and evaluation plan.

Prepared October 16, 2026.

## Executive assessment

The original slide contains useful techniques, but it is not a defensible ascending savings ladder. It mixes lower prices per call, fewer calls, improved completion rates, and simply doing less work. **More implementation complexity does not reliably produce greater savings.**

The objective is to minimize token-priced inference spend per successfully completed task or workflow while holding the acceptance bar fixed. Raw token count alone is insufficient because models, output tokens, cached input, and cache writes have different prices.

This document focuses on inference spend. Human review, delivery time, and infrastructure costs remain important guardrails, but are not the primary optimization target. Local inference must distinguish lower hosted charges from lower total cost.

The ordering below is a recommended adoption sequence, not measured savings for this repository. Product and pricing claims reflect the cited sources and may change.

## Company-level AI spend strategy

The slide's eight bullets are not competing choices on one savings scale. They mix a use-case decision, rollout size, usage controls, engineering practice, and business strategy. A stronger company policy combines them:

1. **Choose work by value, not by novelty.** Do not use AI where a deterministic tool or existing process meets the need better. Start with a business problem and a measurable outcome; AI is a means, not the objective. [10]
2. **Pilot, then expand on evidence.** Giving AI to only a few people can be a useful pilot, but a permanently small cohort is not automatically cheaper or better. Giving it to everyone at once is also not a default. GitHub says many successful Copilot rollouts offer self-service licenses, alongside license utilization and enablement. Choose the rollout based on licensing economics, readiness, risk, and measured value. [8][11]
3. **Use budgets as guardrails, not as an ROI strategy.** GitHub Copilot provides user-level AI-credit budgets that are hard stops across included and metered credit use. Cost-center, organization, and enterprise spending limits apply to metered charges after the shared pool is exhausted; they only stop usage if “Stop usage when budget limit is reached” is enabled. They do not cap license fees, and Copilot does not automatically fall back to a cheaper model when a user is blocked. These controls are Copilot-specific; verify the billing semantics of other providers. [9]
4. **Manage measured workflow spend.** Track usage and charges by user, model, and cost center where available. For engineering comparisons, count all model calls, retries, tools, and failed runs; token count alone is not the invoice or the value delivered.
5. **Set ROI targets before rollout.** Define a baseline, accepted-quality bar, and business outcome such as cycle time, resolution rate, or rework. Compare attributable benefits and total costs over a stated period; adoption or activity is not itself ROI. [10]
6. **Treat AI development tools as engineered systems.** Apply security, access control, evaluation, observability, bounded execution, enablement, and regular review. That discipline is how an organization can pursue competitive advantage without treating spend as unconstrained.

**Short version:** adopt where AI beats the alternative, roll out in evidence-backed stages, set explicit spend controls, engineer and measure the workflows, then expand where the net value holds. The slide should present this as a portfolio operating model—not a choice between “only a few” and “everyone,” or between engineering discipline and competitive advantage.

## 1. Recommended adoption order

Start with simple controls, then add sophistication where measured results justify it. Savings potential is workload-dependent. A deterministic script near the beginning can save more than a sophisticated router near the end.

![Quadrant placing ten cost levers by implementation effort and savings potential, numbered in adoption order](diagrams/cost-levers-quadrant.svg)

*Positions are qualitative judgments, not measurements; the numbers match the Order column below.*

| Order | Recommendation | Effort | Savings potential and caveat |
|---|---|---|---|
| 1 | Stop unnecessary generation | Very low | Avoid redundant summaries, repeated explanations, and work without a defined outcome. Small per interaction; potentially substantial in aggregate. |
| 2 | Use Auto's cost-oriented tier | Very low | Easy routing benefit. GitHub documents a 10% model-cost discount for paid plans, plus workload-dependent routing savings. Not necessarily cheaper than choosing a suitable small model directly. [2] |
| 3 | Right-size model and reasoning effort | Low | Potentially large savings when expensive models handle routine work. Include retries, escalation, and output/reasoning costs in the comparison. |
| 4 | Use deterministic tools | Low-medium | Replace generation with exact transformations, calculations, searches, and repeatable scripts. Eliminating frequent calls can outperform complex orchestration. [1] |
| 5 | Reduce unnecessary context and output | Low-medium | Target relevant files, bounded tool results, and concise responses. Preserve essential context: failures and rediscovery can erase savings. |
| 6 | Make instructions and skills selective | Medium | Keep global guidance lean and load specialized instructions and references on demand. Front matter enables discovery; it does not itself guarantee savings. [5] |
| 7 | Optimize prompt-cache reuse | Medium | High potential for repeated shared prefixes. Measure actual cache hits and model-specific read/write costs. Input discounts are not whole-workflow discounts. [6] |
| 8 | Evaluate managed orchestration | Low to enable; medium to evaluate | HydraFusion can reduce cost versus always using a frontier model. Compare against an appropriate single-model baseline, not only the most expensive option. [3] |
| 9 | Build evaluated routing and bounded agents | High | High potential across recurring, varied workflows. Include router, evaluator, duplicated context, retry, and fallback costs. [4] |
| 10 | Move suitable workloads to local models | Medium-high | Can substantially reduce hosted token charges. Report hardware, utilization, operations, and capability separately before claiming total savings. |

## 2. Fact-check and debate

### "Do not use AI."

True for avoided inference charges, but not proof that the underlying work became cheaper. Use as an opening joke, then make the operational rule: **do not invoke a model when a deterministic tool already solves the task.** [1]

### "Use local LLMs."

A deployment choice, not free inference. Existing hardware can lower marginal hosted spend, while new hardware or low utilization can undermine total savings. Compare accepted outcomes at the required capability, not only token prices.

### "Do not use YOLO mode."

If YOLO means bypassing permission prompts, it is a permission setting, not a spending cap. Checkpoints may interrupt waste but can add interaction overhead. Replace this claim with **bounded execution: budgets, retries, fan-out, and explicit stopping conditions.**

### "Use AI only for complex tasks."

Too broad. Simple, high-volume tasks can be excellent fits for inexpensive models, while complex tasks can generate costly unsuccessful agent runs. Use AI where it beats the non-AI alternative at the required quality.

### "Use token optimization techniques."

Directionally sound but too vague. Specify context selection, bounded tool output, concise generation, appropriate reasoning effort, and fewer redundant calls. Shorter prompts are not automatically cheaper if they cause failures.

### "Use different models."

A strong lever when models are matched to demonstrated task capability. Manual selection, automatic routing, and fallback cascades are distinct strategies. Count the complete workflow rather than the cheapest first attempt.

### "Use Auto."

Supported, with qualifications. GitHub documents Efficiency, Balance, and Intelligence tiers, and a 10% model-cost discount for paid plans. Auto does not mean always choosing the cheapest model, and additional savings depend on the routing outcome. [2]

### "HydraFusion / Ensemble."

Split these terms. HydraFusion selects **Single, Cascade, or Critique** execution patterns. A generic ensemble that invokes multiple models and aggregates outputs is not equivalent, nor inherently cheaper. [3]

GitHub reports **36-67% lower estimated workflow cost versus Claude Opus 5** across three offline coding benchmarks, with quality differences from **-1.5 to +4.9 percentage points**. Results used tuned configurations and specific models, benchmark revisions, and pricing assumptions. They are not guaranteed production savings. [3]

### "Use frontier models: just take my money."

The joke obscures a legitimate optimization: a more expensive model can minimize workflow spend by succeeding without repeated retries. The problem is indiscriminate frontier use, not frontier use itself.

> Illustrative arithmetic, not a benchmark: three unsuccessful attempts at $0.04 each followed by a successful $0.10 escalation cost $0.22. A successful $0.10 frontier attempt first would be cheaper.

A real comparison must measure both strategies on the same tasks.

### "Optimize with instructions, agents, skills, and caching."

Separate the mechanisms. Instructions can reduce rediscovery but add input; skills can selectively load guidance; agents add calls and coordination; caching changes eligible input pricing. Agentic systems often trade higher cost and latency for better performance. [4][5][6]

### "Add front matter, progressive disclosure, and intent routers."

These enable selective loading or routing, not guaranteed savings. The Agent Skills specification supports metadata-first discovery and on-demand content loading. Overbroad triggers can still load unnecessary content; routers must save more than their own cost and mistakes. [5]

### "Skip AI for non-AI tasks."

Keep this idea, but define the boundary with examples: deterministic calculations, exact lookups, formatting, and repeatable transformations. It overlaps with the opening "do not use AI" claim and should not be counted as a separate additive saving.

### "Do not be an AI vampire."

The working definition is someone using AI day and night. Duration alone does not identify waste. A continuously running agent delivering accepted work can be efficient; a short sprawling conversation can be wasteful.

Replace with: **stop unproductive loops, not productive automation.**

## 3. Measurement plan for the demo repository

The stated goal, "lowest cost per task or workflow," is an objective, not a baseline. Establish a concrete baseline before claiming a reduction.

### Task set

Use representative tasks with fixed inputs, repository revisions, tool access, and acceptance criteria. Include routine, moderate, and difficult work, plus deterministic tasks that may not need generation.

### Baseline

Record the product and plan, model and version, reasoning configuration, instructions, tool setup, and pricing date. Establish both completion rate and complete inference spend.

### Comparison sequence

Compare the baseline with Auto, right-sized model selection, deterministic substitution, selective context/instructions, cache optimization, and managed orchestration. Isolate changes before testing combinations.

### Repeatability

Run repeated trials where practical; report variation rather than a single favorable run. Separate cold-cache from warm-cache results and disclose how cache writes are amortized.

### Complete accounting

Capture every invoked model and workflow leg, including routing, drafting, critique, revision, retry, fallback, and failed or cancelled runs. Separate uncached input, cached input, cache writes where applicable, and output/reasoning as exposed by the provider.

### Primary metric

```text
Inference cost per accepted completion =
    total inference spend across all evaluation runs
    / number of accepted completions
```

If no runs succeed, report no accepted completions rather than a misleading cost figure.

### Guardrails

Report completion rate, acceptance criteria, retry/escalation frequency, and elapsed time alongside cost. Keep human review requirements visible so quality is not silently traded away.

### Billing distinction

Separate usage valued at documented rates from incremental cash charges. Included plan allowances can change the immediate bill without changing underlying consumption. [7]

### Attribution

Do not add overlapping percentage savings. Selective skills, progressive disclosure, and reduced context may all describe the same avoided tokens. Report measured incremental and combined results.

## 4. Presenter challenge sheet

Use these questions to pressure-test the argument before presenting. They are discussion prompts, not claims that have already been resolved.

1. What exact baseline, task mix, and acceptance criteria does each savings claim use?
2. Are we reducing token count, token-priced consumption, or the cash invoice? Where do those diverge?
3. What evidence shows the cheaper model plus retries costs less than a stronger model succeeding once?
4. Which deterministic workflow eliminates model calls entirely, and how much of the current workload does it cover?
5. Which control actually stops runaway execution? How is it different from changing tool permissions?
6. What cache hit rate and reuse level make the cache strategy economical after write costs?
7. Does the router still save money after classification, misrouting, escalation, and duplicated context?
8. What separates productive around-the-clock automation from unproductive repeated generation?
9. Which optimization has failed the fixed quality bar, even though its first call looked cheaper?

## 5. Recommended slide treatment

Use the title **"Lower token cost per completed workflow."** Replace the long bullet list with an adoption sequence or a two-axis chart showing implementation effort versus measured cost reduction. Until measurements exist, label the ordering as recommended adoption, not an ascending savings curve.

For the company-spend slide, group the story into four moves: **select valuable use cases; pilot and expand; control and measure spend; engineer for outcomes.** Do not frame “few people” versus “everyone” or “engineering” versus “competitive advantage” as mutually exclusive choices. Keep frontier models, local deployment, and continuous automation as conditional choices rather than moral judgments.

## Sources

Sources for this guide consulted October 15-16, 2026.

1. [OpenAI: Latency optimization](https://developers.openai.com/api/docs/guides/latency-optimization)
2. [GitHub: About Copilot auto model selection](https://docs.github.com/en/copilot/concepts/models/auto-model-selection)
3. [GitHub: Project HydraFusion - frontier quality via multi-model orchestration](https://github.blog/ai-and-ml/github-copilot/project-hydrafusion-frontier-quality-via-multi-model-orchestration/)
4. [Anthropic: Building effective agents](https://www.anthropic.com/engineering/building-effective-agents)
5. [Agent Skills specification](https://agentskills.io/specification)
6. [OpenAI: Prompt caching](https://developers.openai.com/api/docs/guides/prompt-caching)
7. [GitHub: Models and pricing for GitHub Copilot](https://docs.github.com/en/copilot/reference/copilot-billing/models-and-pricing)
8. [GitHub: Managing your company's spending on GitHub Copilot](https://docs.github.com/en/copilot/how-tos/manage-and-track-spending/manage-company-spending)
9. [GitHub: Budgets for usage-based billing](https://docs.github.com/en/copilot/concepts/billing-and-usage/organizations-and-enterprises/budgets)
10. [Microsoft Cloud Adoption Framework: Plan for AI adoption](https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/ai/plan)
11. [GitHub: Setting up a self-serve process for Copilot licenses](https://docs.github.com/en/copilot/tutorials/roll-out-at-scale/assign-licenses/set-up-self-serve-licenses)
