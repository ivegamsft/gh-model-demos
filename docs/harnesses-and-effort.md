# Harnesses, Effort, and Prompt Patterns: Cost Optimization Guide

Prepared October 15, 2026. Product features, supported models, and billing can change.

## Main conclusion

**Optimize the whole task, not just the model or the length of the prompt.**

The harness is the application or agent runtime around the model. It supplies instructions, selects context and tools, manages history and caching, executes tools, and controls agent iteration and delegation. The same model can consume different amounts of tokens in different harnesses.

Effort is a separate lever: it influences how much work a supported model does when generating a response. Lower effort can reduce generation cost, but failed attempts and additional tool calls can erase the saving.

The useful metric is **total cost per accepted completion**, with quality and safety held constant. Fewer tokens, fewer turns, or a higher cache hit rate alone do not prove better economics.

Related guides: [Prompt caching](prompt-caching-guidance.md) and [Model usage cost optimization](model-usage-cost-optimization.md).

## 1. Where the cost comes from

For token-priced usage, a conceptual accounting model is:

```text
Task model cost =
  sum across all main-agent and subagent requests of:
    ordinary input tokens * ordinary input rate
  + cache-write tokens * write rate, where separately charged
  + cache-read tokens * read rate
  + billed output tokens * output rate

Total workflow cost =
  task model cost
  + separately billed tools and execution infrastructure
  + human review and rework, if measuring economic cost rather than token spend
```

Use the provider's actual accounting categories. Reasoning may already be included in billed output: do not add it a second time. Cache fields can also overlap with reported input totals.

A tool's execution is not necessarily a model call, but selecting the tool, generating arguments, processing its result, and deciding what to do next can require model calls. A large result can increase the input of subsequent requests.

Cached input is cheaper, not free. It still occupies context. A large warm conversation can cost more than a small cold one.

## 2. Harness comparison

Here, "GitHub app" means the **GitHub Copilot app**, not an arbitrary GitHub App integration. "Claude app" means Claude web/desktop chat; Claude Code is a separate coding harness.

| Harness | Relevant behavior | Practical cost controls | Billing interpretation |
|---|---|---|---|
| VS Code with Copilot | Editor context, file attachments, repository search, tools, and agent execution. VS Code documents provider-specific cache management and deferred tool loading. [1] | Attach relevant files; choose an appropriate chat/agent mode; avoid unnecessary MCP tools; scope edits and tests. | Copilot AI credits account for model and token usage. [2] Local execution does not eliminate model charges. |
| Copilot CLI | Terminal-oriented agent execution, context management, tools, and optional subagents. | Inspect `/context` and `/usage`; use `/compact` when appropriate; start `/new` for unrelated work; configure `/limits` and bounded delegation. [3][9] | Copilot AI credits. Session limits are soft controls, not a guaranteed hard billing cutoff. [3] |
| Copilot cloud agent | Background repository work in a cloud development environment; a task can involve many model calls. [2][10] | Supply acceptance criteria, setup instructions, allowed scope, and stopping rules. Select supported reasoning level when starting a task. [5] | Copilot AI credits. Separately verify any execution/infrastructure charges applicable to the workflow; do not assume all cloud compute is included or separately billed. |
| GitHub Copilot app | An app surface with model selection, Auto tiers, and supported reasoning controls. [4][6] | Match routing tier and reasoning to the task; limit context, delegation, and completion scope. | Copilot usage rules apply; the app UI itself does not establish a lower per-task cost. [2][4] |
| Claude web/desktop app | Conversational work with available model, thinking/effort, document, and tool capabilities. Exact controls depend on model and plan. | Select appropriate model/settings, supply focused documents, and bound analysis. | Evaluate actual plan usage and any enabled paid extra usage. Do not convert API list-price token estimates directly into a subscription invoice. |
| Claude Code, for comparison | Coding harness with tools, context management, and agent workflows. | Use its usage reporting and cost controls; scope tasks, tools, and automation. | API-backed usage and subscription-included usage are different. Anthropic explicitly says its session API-cost figure is not a subscription billing figure. [8] |

**There is no evidence here for a universal price ranking such as "CLI is cheaper than VS Code" or "cloud is always most expensive."** Task fit, model, settings, context, tool behavior, and retries determine the result. A cloud agent may use more tokens but save human time; a local agent may repeatedly explore the wrong files.

### What has actually been measured?

VS Code's June 2026 report provides evidence that harness engineering matters. [1]

- Deferred tool loading reduced session tokens by 8.97% with GPT-5.4 and 10.92% with GPT-5.5 in its experiment.
- Extended retention increased GPT-5.4 cache hit rates by 919% relative after 40-60 minute gaps: 10.19 times the earlier hit rate, not 919 percentage points or 91.9% cost savings.
- Its Anthropic integration reported approximately 94% agentic cache hits.

These are product/model-specific observations, not savings guarantees or a head-to-head comparison of all harnesses.

### Caching is largely a harness responsibility

The harness controls provider request formatting, cache configuration, context selection, compaction, and tool definitions. A Markdown prompt cannot directly set those provider parameters.

GitHub's optimization guide describes 24-hour OpenAI and one-hour retention for most other models. [3] Treat this as product guidance, not proof that every model/integration has that lifetime. The VS Code report specifically discusses extended retention for supported models. Direct API defaults can differ.

Preserve useful continuity, not irrelevant history. Changing models, tools, effort, or context configuration can invalidate reusable portions. The exact effect is provider/model-specific; a change need not invalidate every earlier cached segment. See the [prompt caching guide](prompt-caching-guidance.md).

## 3. Effort, thinking, routing, and verbosity are different

| Control | What it changes | What it does not guarantee |
|---|---|---|
| Auto Efficiency / Balance / Intelligence | Preference in model routing, while still considering the task. GitHub says all three tiers have the same models available. [4] | A fixed model, fixed effort, fixed token budget, or fixed quality level. |
| Reasoning effort, such as low/medium/high/max | Model-specific reasoning and generation behavior. Higher levels generally spend more tokens on the same problem. [5][6][7] | A precise token count, a universal multiplier, or better results on every task. |
| Thinking / adaptive thinking | Whether and how the model reasons, subject to supported model behavior. | Identical behavior across providers or the ability to disable thinking on every model. |
| Response length / verbosity | The desired amount of visible explanation. | A cap on hidden reasoning, tool calls, or workflow cost. "Be concise" is not a hard spending limit. |
| Context-window capacity | How much context the model can accept. | That the window is fully used, or that a larger window improves quality. Billing depends on actual usage and applicable pricing. |
| Agent budgets and limits | Bounds on iteration, time, delegation, or credits where enforced by the harness. | That a natural-language instruction is enforced as a hard limit. |

**"Balance" in Auto is not equivalent to "medium" effort.** Likewise, a subscription named "Max" is not the model's `max` effort setting.

Copilot supports reasoning controls for supported models in VS Code, CLI, and the Copilot app; the August announcement also covers cloud agent. [5][6] Auto tiers are documented only for VS Code, CLI, and the Copilot app, although Auto itself is available more broadly. Paid Auto usage receives a documented 10% discount on model costs. [4]

Anthropic's API effort levels include low, medium, high, xhigh, and max, with support varying by model. Effort is a behavioral signal, not a strict budget. Most supported models default to high; Opus 5.5 and Haiku 5.5 default to medium. [7] Do not assume an app exposes every API setting.

Anthropic says effort can affect thinking, text, and tool-call generation. Model-specific guidance also warns that reducing effort does not reliably shorten visible responses on every model. Ask for a bounded deliverable separately. [7]

### Working policy

Use low/default effort for straightforward extraction, formatting, and well-specified implementation when quality holds. Use higher effort for genuinely difficult diagnosis, architecture, or tradeoffs. Reserve max for cases where measured improvement justifies the additional cost.

Effort affects input cost indirectly too: extra reasoning may trigger more tools, generate longer history, or avoid an expensive failed attempt. Do not claim "effort affects only output and never input."

For difficult projects, a strong model can produce a useful plan and a cheaper model can execute it. However, separate sessions are not automatically cheaper: they add handoff and cache-rebuild costs and may lose important context. Split when the phases are materially different; keep small, tightly coupled tasks together.

## 4. Prompt patterns

Good and bad example prompts now live in the [prompt library](../prompts/README.md), one folder per pattern, with machine-readable frontmatter for the test harness. Each prompt records its suggested configuration, safety caps, fixtures, shared acceptance criteria, expected processing, and expected result.

Expected processing and results are **hypotheses to test, not executed benchmarks**. Configure model, effort, and limits in the harness; writing "use low effort" in a prompt does not reliably change the API setting.

| Pattern | Suggested starting configuration | Primary source of waste |
|---|---|---|
| [One-shot](../prompts/one-shot/) | Lightweight model, low effort, no tools | Unneeded research or output for a deterministic transformation |
| [Structured extraction](../prompts/structured-extraction/) | Lightweight model, low effort, no tools | Prose instead of schema output, forcing a second call |
| [Batch classification](../prompts/batch-classification/) | Lightweight model, low effort, repeated | Changing prefix defeats caching; verbose labels |
| [Long-context summarization](../prompts/long-context-summarization/) | Mid model, medium effort | Unbounded restatement of a large input |
| [RAG](../prompts/rag/) | Mid model, medium effort, retrieval | Excessive retrieval, stale evidence, and unsupported answers |
| [Complex, multi-turn](../prompts/multi-turn/) | Mid model, medium effort | Missing evidence, repeated discovery, and context drift |
| [Plan then implement](../prompts/plan-then-implement/) | Strong/high to plan, mid/medium to implement | Expensive reasoning spent on routine execution |
| [Design and debate](../prompts/design-debate/) | Strong model, high effort | Unbounded alternatives and argument without decision criteria |
| [Research fan-out](../prompts/research-fan-out/) | Strong lead, light workers | Over-spawning and duplicated searches |
| [Endless debate loop](../prompts/endless-debate-loop/) | Never uncapped; bounded critique instead | No convergence rule or externally checkable endpoint |
| [Agentic task](../prompts/agentic-task/) | Mid model, medium effort | Scope expansion, unnecessary delegation, and repeated repair |
| [Multi-tool](../prompts/multi-tool/) | Mid model, medium effort, scoped tools | Broad queries, oversized results, and duplicated tool work |
| [Agent loop](../prompts/agent-loop/) | Mid model, medium effort, iteration cap | Repeated attempts without a changed hypothesis |
| [Headless agentic](../prompts/headless-agentic/) | Mid model, non-interactive, scoped tools | No human checkpoint and no machine-readable endpoint |
| [Code review](../prompts/code-review/) | Mid model, read-only | Nitpicks and unbounded findings |
| [Orchestration](../prompts/orchestration/) | Strong orchestrator, light workers | Over-delegation, overlapping work, and duplicated context |

How these workloads change cost structurally is covered in [AI workloads and cost](ai-workloads-cost.md).

## 5. What to measure in a demo

Run good and bad variants in separate comparable sessions. Keep harness/version, model, effort, permissions, repository snapshot, fixture data, tool availability, and acceptance criteria fixed when isolating prompt quality. Compare harnesses or effort levels in separate experiments, changing one variable at a time.

Use labeled cold/warm cache conditions, record actual cache usage, and repeat trials. Do not reuse the fix from the first run as the starting point for the second.

| Measure | Why it matters |
|---|---|
| Acceptance outcome and factual correctness | A cheaper wrong answer is not a saving. For code, check behavior; for RAG, check evidence and citations. |
| Total model cost across all attempts and agents | Avoid hiding retries or subagent costs. |
| Ordinary input, cache reads/writes, output, and exposed reasoning usage | Explain the cost difference without double counting. |
| Tool calls, result volume, repair iterations, and debate rounds | Identify avoidable orchestration and context growth. |
| Wall-clock time and human intervention | Distinguish token efficiency from end-to-end productivity. |
| Limit reached, blocker, or incomplete result | Prevent bounded failure from being reported as success. |

### Capturing Copilot CLI `/usage`

In an interactive Copilot CLI session, `/usage` reports the session's AI credits
used, an input/output/cached-token breakdown, and progress against applicable
usage limits. On the legacy billing platform, it reports premium requests instead.
Capture the actual output with the run evidence; the display depends on the
billing platform and CLI version.

Record these fields from the output (this is a normalized template, not a
verbatim screen capture):

```text
Session usage: <AI credits used, or legacy premium requests>
Tokens: input <count>; output <count>; cached <count>
Usage limit: <used / limit, when shown>
```

Use one comparable workload condition per session when attributing usage to a
run. Keep the CLI version and billing platform with the record. AI credits and
premium requests are not provider-dollar charges, and token totals alone do not
determine an invoice. For non-interactive runs, `--usage-output-file <file>`
saves final usage statistics as JSON; preserve that file with the run artifacts
and treat missing metrics as unknown, not zero.

For a fixed suite:

```text
Cost per accepted completion =
  total spend on all attempts, including failed attempts
  / number of accepted completions
```

If there are zero accepted completions, report zero completions and total spend; the ratio is undefined, not zero. For subscription products, separately report allowance consumption, paid extra usage, and any modeled API-equivalent estimate.

## 6. Debate and presenter challenges

1. **"The shortest prompt is cheapest."** Can you show that it did not omit information that caused retries? A longer, precise prompt can reduce total work.
2. **"Max effort is best."** Which acceptance result improved enough to justify the extra tokens? Keep visible answer length separate from reasoning.
3. **"CLI beats VS Code."** Did you hold model, task, effort, tools, and starting context constant? Otherwise the causal claim is unsupported.
4. **"More agents save money."** Did you count duplicated context, coordination, and all subagent calls? Faster is not necessarily cheaper.
5. **"A 94% cache hit rate proves low cost."** How large was the context, and what were output and retry costs?
6. **"The debate found more issues, so it helped."** Were the issues evidence-backed and material, or did each round invent a new preference?
7. **"The loop stayed within budget, so it succeeded."** Did it meet acceptance criteria, or merely stop spending?
8. **"Always plan with the strongest model."** Is the task ambiguous enough to justify a separate planning call? For a three-bullet rewrite, probably not.

**Slide-ready statement:** Choose the harness for the workflow, the model for the task, and effort for the difficulty. Give agents evidence, a measurable endpoint, and enforced limits. Measure cost per accepted result.

## Sources

1. [VS Code: Improving token efficiency for GitHub Copilot](https://code.visualstudio.com/blogs/2026/06/17/improving-token-efficiency-in-github-copilot)
2. [GitHub: Usage-based billing for individuals](https://docs.github.com/en/copilot/concepts/billing-and-usage/individuals/billing)
3. [GitHub: Optimizing AI usage](https://docs.github.com/en/copilot/tutorials/optimize-ai-usage)
4. [GitHub: About Copilot auto model selection](https://docs.github.com/en/copilot/concepts/models/auto-model-selection)
5. [GitHub changelog: Reasoning levels for cloud agent](https://github.blog/changelog/2026-08-03-customize-the-reasoning-level-for-copilot-cloud-agent/)
6. [GitHub changelog: Larger context and configurable reasoning](https://github.blog/changelog/2026-06-04-larger-context-windows-and-configurable-reasoning-levels-for-github-copilot/)
7. [Anthropic: Effort](https://platform.claude.com/docs/en/build-with-claude/effort)
8. [Anthropic: Manage Claude Code costs](https://code.claude.com/docs/en/costs)
9. Copilot CLI built-in help (`copilot help billing`, `copilot --help`), consulted October 15–16, 2026: `/context`, `/usage`, `/compact`, `/new`, `/limits`, `/subagents`, and `--usage-output-file`. Commands and availability can vary by CLI version.
10. [GitHub: Copilot on GitHub.com and cloud agent](https://docs.github.com/en/copilot/concepts/agents/cloud-agent/about-cloud-agent)
