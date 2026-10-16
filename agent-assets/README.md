# Agent customization test library

Paired examples for testing how skills, agents, instructions, prompt files, and progressive disclosure affect task quality, caching, and cost. Good examples follow [frontmatter and scripts guidance](../docs/frontmatter-and-scripts.md). Bad examples reproduce common mistakes from copied internet templates and generated configurations; each issue is subtle on its own.

These are **test fixtures, not active configuration**. Copilot does not load them from this folder. To run an experiment, copy one variant into the location the harness reads (for example `.github/skills/`, `.github/agents/`, `.github/instructions/`, or `.github/prompts/`) in a disposable fixture repository.

## Layout

```text
agent-assets/
  skills/
    good/comparing-run-costs/        SKILL.md, scripts/summarize_runs.py, references/metrics.md
    bad/cost-helper/                 SKILL.md (inline script, hardcoded prices)
  agents/
    good/workload-reviewer.agent.md  read-only, scoped tools, mid-tier model
    good/deep-researcher.agent.md    expensive; manual selection only
    bad/code-reviewer.agent.md
    bad/researcher.agent.md
  instructions/
    good/copilot-instructions.md     short, always on
    good/instructions/*.instructions.md   applyTo globs or description-only
    bad/copilot-instructions.md
    bad/instructions/*.instructions.md
  prompt-files/
    good/summarize-run.prompt.md
    bad/analyze-runs.prompt.md
  progressive-disclosure/
    good/reviewing-cache-efficiency/ SKILL.md routes to one reference by symptom; script
    good/instructions/run-config.instructions.md   glob-gated entry point to that reference
    bad/cache-efficiency/            reads everything; nested reference chain
    bad/instructions/caching.instructions.md       broad glob, full guide inlined
```

### Glob patterns: disclosure and usage

`applyTo` globs decide **when** instruction text is disclosed. They are relative to the workspace root, so the patterns below assume these folders exist in the fixture repository: `harness/` (runner code), `harness/configs/` (per-run YAML), `harness/results/` (recorded usage logs), and `prompts/`.

| File | `applyTo` | Purpose | Loads when |
|---|---|---|---|
| `harness-python.instructions.md` | `harness/**/*.py` | Code conventions | Harness Python is created or edited |
| `prompt-library.instructions.md` | `prompts/**/*.prompt.md` | Prompt-library frontmatter rules | A prompt file is created or edited |
| `usage-data.instructions.md` | `harness/results/**/*.jsonl` | **Usage**: rules for recorded token-usage logs | A usage log is created or edited |
| `run-config.instructions.md` | `harness/configs/**/*.yaml` | **Disclosure**: two-line cache rule, links to one reference | A run config is changed; the reference loads only if needed |
| `cost-reports.instructions.md` | none (`description` only) | Analysis writing rules | The agent judges the task relevant |

Matching bad files use globs that look targeted but misfire: `*.jsonl` matches only workspace-root files and never attaches to `harness/results/`. `**/*.{md,py,yaml,json,jsonl}` matches almost every file in the repository, so detailed caching text loads on unrelated edits.

## Good examples: what they demonstrate

| Example | Frontmatter and design choices |
|---|---|
| `comparing-run-costs` skill | Valid `name` matching its folder; description with what, when, and when not; `compatibility`; deterministic script that is run, not read; one reference loaded only when a field is ambiguous |
| `workload-reviewer` agent | Specific `description`; `tools: ["read", "search"]`; mid-tier `model`; bounded output |
| `deep-researcher` agent | `disable-model-invocation: true` so an expensive agent runs only when selected; source and word caps |
| Repository instructions | Four always-on invariants; points to targeted files instead of inlining them |
| `harness-python.instructions.md` | `applyTo: "harness/**/*.py"` so Python rules attach only to harness code |
| `prompt-library.instructions.md` | `applyTo: "prompts/**/*.prompt.md"` |
| `usage-data.instructions.md` | `applyTo: "harness/results/**/*.jsonl"`; points to the summary script instead of reading whole logs |
| `run-config.instructions.md` (progressive disclosure) | `applyTo: "harness/configs/**/*.yaml"`; tier-1 rule with a link to one reference loaded only on a cache-ratio drop |
| `cost-reports.instructions.md` | `description` only, no `applyTo`, so it loads on demand for analysis tasks, not on file edits |
| `summarize-run` prompt file | `agent: ask`, `tools: []`, argument hint, fixed output columns |
| `reviewing-cache-efficiency` skill | Routes to exactly one one-level-deep reference by symptom; script output is a compact CSV |

## Bad examples: the issues to look for

| Example | Issue | Why it is common | Likely effect |
|---|---|---|---|
| **cost-helper skill** | `name: Cost Helper` is invalid and does not match the folder `cost-helper` | Names copied from titles | May fail to load or validate |
| | First-person, overbroad description ("I can help... anything related to AI usage") | Marketing-style copy | Activates on unrelated tasks |
| | `version` and `last_updated` as top-level fields | Copied from package metadata | Nonstandard fields; editing the date changes routing metadata for no benefit |
| | Persona preamble ("expert FinOps engineer with 15 years") | Popular prompt template | Tokens with little task value |
| | Hardcoded price table with no source or date | Pasted from a blog post | Stale rates presented as current |
| | Inline script the agent must write to a file | "Just paste this code" tutorials | Code enters context and output tokens on every use |
| | Script adds cached tokens to input | Misread usage fields | Double-counts on providers that include cached tokens in input |
| | Script prints every record with `indent=2` | Debug output left in | Large output replayed in history |
| | "ALWAYS double-check by running again" | Reliability folklore | Doubles tool calls with no new evidence |
| **code-reviewer agent** | No `tools` field | Omitted in examples | All tools enabled, including edit and execute |
| | "Fix any issues you find" in a reviewer | Helpful-sounding instruction | Reviewer edits code; scope creep |
| | Pinned top-tier model for every review | "Use the best model" advice | Highest rate on trivial reviews |
| | Vague two-word description | Minimal template | Poor automatic delegation |
| | "Check everything" with no output limit | Thoroughness bias | Long, nitpick-heavy reviews |
| **researcher agent** | `tools: ["*"]` | Copy of a permissive example | All tools on every call |
| | "Check as many sources as possible" | Thoroughness bias | No stopping rule |
| | Model invocation not disabled | Default left in place | Expensive agent may be selected automatically |
| **copilot-instructions.md** | Persona, "think step by step", "never be lazy", emoji guidance | Viral prompt lists | Always-on tokens with little effect on modern models |
| | `Last updated` date | Documentation habit | Edits change the always-on prefix |
| | "Make a reasonable assumption and continue" | Avoiding interruptions | Silent wrong assumptions |
| | "Always use the latest versions" | Generic best practice | Unpinned dependencies; agent may upgrade libraries |
| | Generic tech stack list not specific to the repository | Template boilerplate | Context with no routing value |
| | "Use unittest" conflicts with `testing.instructions.md` "Use pytest" | Files written at different times | Inconsistent tests |
| **python.instructions.md** | `applyTo: "**"` on Python-only rules | Copied glob from an example | Attaches to Markdown, YAML, and every other file |
| | "Log at DEBUG level so nothing is missed" | Debugging habit | Verbose logs in tool output |
| **usage-data.instructions.md** | `applyTo: "*.jsonl"` matches only root-level files | Glob written as if it were a file extension filter | Never attaches to `harness/results/`; rules silently unused |
| | Cost formula adds `cached_tokens` to input at the full input rate | Simplified blog formula | Double-counts, and ignores the cached-read discount |
| **caching.instructions.md** (progressive disclosure) | `applyTo: "**/*.{md,py,yaml,json,jsonl}"` | Looks scoped because it lists extensions | Effectively always on; full guide loads on unrelated edits |
| | Tutorial paragraph plus every rule inlined | "Put everything the model might need" | Defeats the skill's on-demand references |
| | Plain-text path `references/index.md` relative to the wrong folder | Copied between files | Link does not resolve; agent searches for it |
| **testing.instructions.md** | "Every change must include new tests" | Absolute rule | Tests added for documentation-only changes |
| **analyze-runs prompt file** | `mode: agent` | Older blog posts; the current field is `agent` | Field ignored or behaves unexpectedly |
| | No `tools`; pinned top-tier model | Defaults left in place | All tools and the highest rate for a summary task |
| | "Find all run files", "estimate dollar cost", "suggest prompt improvements" | Bundled requests | Repository-wide search, unsourced prices, scope creep |
| **cache-efficiency skill** | "Read every file in references/ before starting" | Wanting complete context | Defeats progressive disclosure |
| | References nested three levels deep (index → overview → provider) | Organic folder growth | Extra reads; agent may stop early and miss details |
| | Background paragraph explaining what caching is | Tutorial habit | Tokens the model does not need |
| | Analysis described in prose instead of a script | No script written | Model recomputes ratios by hand; inconsistent results |
| | Divides cached by input tokens regardless of provider | Simplified advice | Wrong ratio on providers that report cached tokens separately |
| | Thin provider notes with no source or date | Stub files | Possibly outdated guidance |

"Likely effect" entries are hypotheses to measure, not observed results.

## Running pairs

Keep task, fixture, model, effort, and acceptance criteria constant within a pair unless that variable is the experiment. Reset the fixture repository between runs. Record ordinary input, cache reads, cache writes, output, calls, tool calls, which customizations loaded, and acceptance. Report **cost per accepted completion**, including failed runs.

Suggested acceptance criteria:

1. The result is correct and supported by the supplied evidence.
2. It follows the requested scope and output format.
3. It makes no unrequested edits and does not invent prices or measurements.

Experiment ideas are listed in [frontmatter and scripts guidance, section 8](../docs/frontmatter-and-scripts.md#8-harness-experiments). Prompt workload examples are in the [prompt library](../prompts/README.md).
