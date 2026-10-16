# Prompt library for the cost test harness

Paired **good** and **bad** prompts for measuring how prompt design changes cost, quality, and reliability. Each pattern has its own folder:

```text
prompts/
  <pattern>/
    good.prompt.md
    bad.prompt.md
```

`expected_processing` and `expected_result` are **hypotheses to test, not measured results**. Replace them with observed data once the harness has run.

## Pattern index

| Pattern | Workload | Interaction | Turns/sessions | Fixture needed | Primary waste tested |
|---|---|---|---|---|---|
| [one-shot](one-shot/) | single-task | interactive | 1 | No (inline) | Unneeded research and output |
| [structured-extraction](structured-extraction/) | single-task | interactive | 1 | No (inline) | Prose instead of schema output |
| [batch-classification](batch-classification/) | single-task (repeated) | headless | 1 x repetitions | Yes | Cache-breaking prefix, verbose output |
| [long-context-summarization](long-context-summarization/) | single-task | interactive | 1 | Yes | Unbounded summary of a large input |
| [rag](rag/) | single-task + retrieval | interactive | 1 | Yes | Over-retrieval, unsupported answers |
| [multi-turn](multi-turn/) | multi-turn | interactive | 2 vs 4 turns | Yes | Late requirements, rework |
| [plan-then-implement](plan-then-implement/) | multi-turn | interactive | 2 sessions vs 1 | Yes | Strong model/high effort on execution |
| [design-debate](design-debate/) | research | interactive | 1 | No | Unbounded alternatives |
| [research-fan-out](research-fan-out/) | research | interactive | 1 | No (web) | Over-spawning, duplicate searches |
| [endless-debate-loop](endless-debate-loop/) | research | headless | 1 (capped) | Yes | No convergence rule |
| [agentic-task](agentic-task/) | agentic | interactive | 1 | Yes | Scope expansion |
| [multi-tool](multi-tool/) | agentic | interactive | 1 | Yes (mock tools) | Broad queries, oversized results |
| [agent-loop](agent-loop/) | agentic | headless | 1 | Yes | Repeated attempts without new evidence |
| [headless-agentic](headless-agentic/) | agentic | headless | 1 | Yes | No human checkpoint, no endpoint |
| [code-review](code-review/) | agentic | headless | 1 | Yes | Nitpicks, unbounded findings |
| [orchestration](orchestration/) | orchestration | headless | 1 | Yes | Over-delegation, duplicated context |

Workload categories are explained in [docs/ai-workloads-cost.md](../docs/ai-workloads-cost.md).

## File format

Each file is Markdown with YAML frontmatter. The body after the frontmatter is the prompt text sent to the harness.

```yaml
---
id: one-shot/good              # <pattern>/<variant>
pattern: one-shot
variant: good                  # good | bad
workload: single-task          # single-task | multi-turn | research | agentic | orchestration
interaction: interactive       # interactive | headless
config:                        # harness configuration
  surface: copilot-cli
  model_class: light           # light | mid | strong | auto
  reasoning_effort: low        # passed to --reasoning-effort when supported
  tools: none                  # none | read-only | web | <list> | default
  subagent_model_class: light  # optional; model class for subagents/workers
  subagent_mechanism: ...      # optional; record subagents vs fleet
run_safety: sandbox-only       # optional; never run outside a disposable sandbox
caps:                          # harness-enforced safety caps; starting values, not cost predictions
  max_ai_credits: 10
  timeout_minutes: 5
repetitions: 1                 # optional; >1 sends the body repeatedly (cache tests)
phases: []                     # optional; per-session config overrides, in order
fixtures: []                   # paths under fixtures/ that must exist before running
acceptance: []                 # shared by both variants; the grader applies the same bar
expected_processing: >         # hypothesis
expected_result: >             # hypothesis
---
```

### Body markers

| Marker | Meaning |
|---|---|
| `<!-- turn -->` | Send the following text as the next user turn **in the same session**. |
| `<!-- session -->` | End the current session and start a **new session**. Apply the next `phases` entry's config. |
| `{{now}}` | Replace with the current ISO-8601 timestamp when sending. It is used to test cache-breaking prefixes. |
| `{{file:<path>}}` | Inline the contents of a fixture file. |
| `{{batch}}` | Replace with the current repetition's input from the pattern's batch fixture. |
| `{{previous_output}}` | Replace with the final response of the previous session, which is the only context carried forward. |

## Experimental rules

1. **Change one variable at a time.** Good and bad variants of a pattern share `config` and `caps`. They differ only in prompt text.
   - Exception: `plan-then-implement` and `orchestration` compare *workflows*, so their config or phases differ by design.
   - Compare harnesses and effort levels in separate experiments by reusing the good prompt with a different config.
2. **Bad variants never run uncapped.** Enforce `caps` in the harness, not in prompt text.
   - Run bad agentic variants only in a disposable sandbox with no credentials, no push access, and no production access.
3. **Grade both variants against the same `acceptance` list.** A cheap failure is not a saving.
4. **Reset fixtures between runs.** Do not let one run's fix become the next run's starting point.
5. **Record cold and warm cache conditions separately.** Repeat each trial; single runs are anecdotes.
6. **Report cost per accepted completion.** Include failed attempts in total spend. With zero acceptances, report total spend and zero completions; the ratio is undefined.

## Example runner mapping (Copilot CLI)

Verify the flags against your CLI version with `copilot --help`.

```powershell
copilot -p $body `
  --model $modelId `
  --reasoning-effort $config.reasoning_effort `
  --max-ai-credits $caps.max_ai_credits `
  --no-ask-user `
  --output-format json `
  --available-tools $toolList
```

- `--max-ai-credits` is a soft session cap. Enforce `timeout_minutes` separately by stopping the process.
- `model_class` is abstract. Map it to concrete model IDs, or `auto`, in harness config so the library survives model changes.
- Multi-turn and multi-session patterns need a runner that can continue sessions. Use your harness's supported mechanism instead of assuming a flag.
- Patterns that expect subagents (research-fan-out, orchestration) may need fleet or subagent support enabled; record which mechanism was used.

## Metrics to capture per run

- Acceptance pass/fail per criterion.
- Model or models used, including subagents.
- Ordinary input, cache read, cache write, and output tokens, as reported by the provider.
- AI credits or dollar cost.
- Model calls, tool calls, subagents spawned, and turns or iterations.
- Wall-clock time and whether a cap was hit.
- Files changed or output size.

## Fixtures still needed

Create these under `fixtures/` before running the corresponding patterns:

| Fixture | Used by | Contents |
|---|---|---|
| `fixtures/batch-classification/label-guide.md` | batch-classification | Stable label definitions and examples, at least 1,500 tokens so the prefix is cacheable |
| `fixtures/batch-classification/tickets.jsonl` | batch-classification | Five batches of five tickets with gold labels |
| `fixtures/long-context/design-doc.md` | long-context-summarization | About 40k-token design document with numbered sections and three seeded decisions |
| `fixtures/rag/policies/` | rag | Versioned refund policies, including a superseded version and a non-US policy as distractors |
| `fixtures/checkout-app/` | multi-turn | Small app with a timeout -> retry double-order bug |
| `fixtures/rate-limit-app/` | plan-then-implement | Small API with no rate limiting and existing tests |
| `fixtures/architecture/notifications-adr.md` | endless-debate-loop | Architecture decision record with stated requirements |
| `fixtures/api-client/` | agentic-task | HTTP client library without a timeout option |
| `fixtures/mock-observability/` | multi-tool | Mock MCP tools for metrics, deployments, and logs with a seeded latency spike |
| `fixtures/retry-regression/` | agent-loop | Repository with one failing retry-timeout test and a seeded regression |
| `fixtures/ci-failure/` | headless-agentic | Repository and CI log with one failing test |
| `fixtures/review-diff/` | code-review | Diff with one seeded off-by-one bug and one seeded injection |
| `fixtures/deprecated-api/` | orchestration | Three modules that use a deprecated API, plus one shared utility |

## Candidate patterns not yet included

- **Session resume and compaction:** a cold return to a long session versus `/compact` versus a fresh session with a summary.
- **Model switching mid-session:** the cache-rebuild cost of changing models in a long session.
- **Tool-set size:** the same task with a minimal tool set versus a large MCP server tool set.
