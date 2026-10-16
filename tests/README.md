# Model usage test harness

## Status and purpose

This directory contains a Docker-based Copilot CLI experiment harness. The host
controller prepares isolated good/bad containers, dispatches prompts, collects
evidence, and generates paired reports. Each variant has its own device-auth
volume; no PAT or host credential directory is required.

Measure whether the paired [prompt patterns](../prompts/README.md) and
[agent assets](../agent-assets/README.md) improve cost, quality, and reliability.
`good` and `bad` are experimental labels, not proven outcomes. The primary measure
is **total cost per accepted completion**, not shortest output or lowest token count.

## Quick start

Requirements: Node.js 22.12+ (Node 24 inside the image), npm, and Docker Desktop
running Linux containers. Run these commands from the repository root in PowerShell:

```powershell
npm ci --prefix .\tests
node .\tests\harness.mjs build
node .\tests\harness.mjs login
node .\tests\harness.mjs preflight
node .\tests\harness.mjs run --pattern structured-extraction --dry-run
node .\tests\harness.mjs run --pattern structured-extraction
```

`login` runs device flow twice. Approve each code in your browser. In this minimal
Linux image there is no system keychain: **accept the CLI's plaintext-storage
prompt** to persist OAuth credentials in the variant's Docker volume. Browser
approval alone is insufficient. Login requires an interactive terminal.

The build pins GitHub CLI 2.89.0 and Copilot CLI 1.0.98. It downloads public npm
tarballs on the host and installs them offline in Docker, accommodating environments
where containers cannot reach the npm registry. TLS verification stays enabled.
The ignored `.build-packages` directory is a reusable public-package cache, not
credential storage. Host npm configuration and credentials never enter the image.
Locked dependency downloads are checked against the source lock's integrity;
legacy SHA-1 entries are normalized to SHA-512 in a generated build-only lock so
npm can resolve the verified tarballs through its offline content cache.
The base image uses a Node 24 tag; each experiment records the actual image ID.

### Run and monitor

```powershell
# Basic paired experiment; the command prints its run ID.
node .\tests\harness.mjs run --pattern one-shot

# In a second terminal, substitute the printed ID (not an absolute path).
node .\tests\harness.mjs monitor --run <run-id> --watch

# Regenerate a report from saved evidence, without making model calls.
node .\tests\harness.mjs report --run <run-id>

# Five paired trials need a higher aggregate budget than the default.
node .\tests\harness.mjs run --pattern structured-extraction --trials 5 --budget 300

# Focused automated tests, with no model calls.
npm test --prefix .\tests
```

Monitoring shows controller/worker state and live Docker CPU/memory statistics.
The controller prints session/turn progress while running. Reports and raw evidence
are saved under the ignored `results/<run-id>/` directory.
Prompt bodies are sent on stdin, avoiding command-line argument length limits for
large fixture expansions and keeping their text out of process argument listings.

### Configuration and current coverage

[config.json](config.json) maps model classes to concrete IDs, tool profiles to
allowlists, resource limits, auth-volume names, and the experiment budget. All three
model classes initially map to **gpt-5-mini** to hold the model constant; they are
not genuine light/mid/strong tier assignments. Configure explicit mappings before
testing model-tier workflows. Every command accepts `--config <path>`.

- Default: one paired trial, unknown provider cache condition, and **60 AI credits
  in summed planned session caps**. Override with `--trials` and `--budget`.
- The controller sums caps across both variants, sessions, repetitions, and trials
  before running. This is admission control, not an exact billing cutoff.
- Copilot CLI 1.0.98 requires a minimum session cap of 30 AI credits. Lower prompt
  caps fail validation before Docker or inference; two single-session variants
  therefore reserve at least 60 credits in planned soft caps.
- `structured-extraction` is ready without fixtures and has a deterministic grader
  for all listed acceptance criteria. `one-shot` is ready without fixtures, but its
  semantic no-invented-facts criterion requires review.
- Multi-turn/session markers, phase model/effort/tool overrides, repetitions, batch
  inputs, and fixture expansion are supported. Each batch-fixture JSONL line must
  be one JSON array of tickets, one line per repetition; ticket fields `label`,
  `gold_label`, and `goldLabel` are withheld from model input.
- Other patterns fail preflight until their declared fixtures exist. Fixture
  symlinks and paths escaping the repository are rejected. Fixture source hashes
  must match across variants.
- `none` exposes an empty tool list; `read-only` exposes `view`, `glob`, and `grep`;
  `web` exposes `web_search` and `web_fetch`; `default` permits ordinary CLI tools
  inside the disposable container. Built-in MCP servers are disabled.
- Specialized profiles (`mock-observability`, `read-only+shell-test`) require an
  explicit tool binding. Their test fixtures/runners are not supplied here.
- Explicit subagent model/mechanism experiments are rejected rather than silently
  ignoring configuration. The separate agent-assets library is not automatically
  installed or activated. These surfaces need dedicated runner support.
- Fixture tests and semantic rubrics beyond the two inline graders need external
  review; completed model execution is not automatically an accepted completion.

### Review results

```powershell
node .\tests\harness.mjs review-template --run <run-id>
```

This creates `review-template.json` beside each `result.json`. Inspect the output,
diff, events, and fixture-test evidence; fill `reviewer`, top-level `evidence`, and
each criterion's `pass`/`fail` status and evidence. Save it as `review.json` beside
the result and regenerate the report. A source hash binds the review to the original
result. Missing, invalid, or stale reviews never silently become passing results.

## Architecture

```text
Host: harness.mjs
  |
  +-- good container: gh + Copilot CLI + good prompt/assets + fixture copy
  +-- bad container:  gh + Copilot CLI + bad prompt/assets + fixture copy
  |
  +-- evidence -> deterministic checks / explicit review -> paired report
```

The controller prepares two fresh, separately named containers per paired repetition.
Both use the same pinned image, GitHub CLI (`gh`), Copilot CLI, runtime dependencies,
resource limits, and fixture snapshot. Both are prepared before dispatch, then run
sequentially to reduce rate-limit contention; the starting variant alternates.
`gh` alone is not a model runner; the image includes Copilot CLI as well.

The controller owns configuration, lifecycle, dispatch, timeouts, evidence
collection, grading, and reporting. Containers execute the assigned workload;
neither container controls the other or grades itself. Give each its own writable
workspace and session state. Do not share caches or mount the host repository
writable. Copy only the selected prompts, assets, and fixtures.

### Controller lifecycle

1. Validate paired frontmatter, identical acceptance criteria, required fixtures,
   model availability, supported effort levels, tool permissions, and safety caps.
   Reject missing fixtures and unsupported settings before any inference.
2. Resolve `light`, `mid`, and `strong` to explicit, recorded model IDs for this
   experiment. These are experimental choices, not catalog capability labels.
   Record Auto as routing, and capture actual selected models when available.
3. Create a run ID and two clean containers; verify both CLIs and runner readiness.
4. Parse frontmatter without sending it as prompt text. Apply config, caps, and
   phase overrides. Expand fixture, batch, timestamp, and previous-output markers.
5. Dispatch the good and bad bodies. `<!-- turn -->` continues the same session;
   `<!-- session -->` creates a fresh session with the next phase configuration.
   Preserve only the specified previous output between sessions. Record the exact
   expanded inputs and repetitions. Do not send an entire multi-turn body at once.
6. Capture structured events, output, exit status, timing, usage, and file changes.
   Enforce timeouts outside the model process. On timeout or failure, collect
   partial evidence and terminate only the affected trial's processes/containers.
7. Grade both variants independently against the same acceptance criteria, then
   produce a paired report. Preserve failures, retries, and cap-hit attempts.
8. Collect available evidence and remove the trial's containers, including when
   execution or grading fails. Authentication volumes persist intentionally.
   SIGINT/SIGTERM trigger scoped stopping/cleanup; a hard kill, host crash, or
   unavailable Docker daemon can require manual cleanup of recorded container names.

### Isolation and authentication

- Use disposable, non-privileged containers with CPU, memory, and process limits.
  No Docker socket, host home directory, host credentials, or production access.
- Authenticate good and bad independently with `copilot login --device-code`.
  Runtime containers mount only their own auth volume read-only and copy its state
  into a fresh disposable home. Sessions and workspace changes are not written back.
- These are trusted prompt-efficiency experiments, **not adversarial isolation
  tests**. OAuth credentials can be read by shell-capable tools inside their own
  container. Read-only mounting does not hide secrets. Separate device logins do
  not create separate GitHub identities, permissions, billing, or quotas.
- Runtime containers use Docker's normal outbound network. Egress allowlisting
  and an inference-only credential broker are not implemented. Fixtures start in
  a fresh Git repository without configured push remotes, but this is not an
  enforceable account-permission boundary.
- Enforce tool allowlists in the runner, not just prompt text. Do not indiscriminately
  enable all tools. A container is not a complete security boundary.
- Treat `max_ai_credits` as a soft session limit. Also enforce wall-clock limits
  and aggregate planned session caps across phases/repetitions/trials. There are
  no automatic retries. Explicit worker-model orchestration remains unsupported;
  any incidental subagent usage is subject to CLI session controls, not a separate
  hard billing guarantee.
- Known GitHub token prefixes and bearer headers are redacted from runtime logs.
  Do not put secrets in fixtures/prompts; inspect evidence before sharing it.
  No credential volume or home directory is exported as experiment evidence.
- Copilot login does not separately authenticate general `gh` commands. These
  experiments do not require authenticated repository API access.

## Experimental methodology

1. **Hold quality constant.** Use identical acceptance criteria, fixture contents,
   and grading rules. Prefer deterministic schema checks and fixture tests; record
   any human/model grader's rubric, version, and independent cost. A cheap failure
   is not a saving.
2. **Change one variable at a time.** Keep model, effort, tools, caps, and harness
   constant for prompt-only comparisons. `plan-then-implement` and `orchestration`
   intentionally compare workflows; report their differences explicitly.
3. **Reset before each trial.** Restore the fixture snapshot and isolate instruction,
   skill, agent, session, and filesystem state. Load only the selected asset variant.
4. **Repeat and balance order.** Start with at least five paired repetitions per
   condition, report the sample count, and alternate/randomize which variant runs
   first. The controller activates both containers but may dispatch sequentially
   to avoid shared rate-limit contention. Record overlap and throttling.
5. **Separate cache conditions.** Label first-use and repeated-prefix trials separately.
   A fresh container does not guarantee a cold provider cache. Record observable
   cache usage and label unobservable cache state unknown.
6. **Keep all attempts.** Report correctness, reliability, latency distributions,
   caps, failures, and total spend, including unsuccessful attempts. Do not silently
   retry or discard inconvenient runs.
7. **Do not manufacture telemetry.** Missing usage/cost/cache fields are unknown,
   not zero. Keep AI credits, provider multipliers, and dollar charges distinct.

For a condition with measured cost:

```text
cost per accepted completion = total cost of all attempts / accepted completions
```

With zero accepted completions the ratio is undefined; report total cost and zero
acceptances. If any attempt lacks cost data, label aggregate cost incomplete rather
than presenting a complete savings estimate. Report quality and acceptance rate
beside any cost comparison.

## Evidence and report contract

Output layout:

```text
results/<run-id>/
  manifest.json
  resolved-plan.json
  status.json
  snapshot/
  trial-1/
    repetition-1/
      good/
        plan.json
        session-1-turn-1-input.md
        session-1-turn-1-stdout.log
        session-1-turn-1-stderr.log
        events.jsonl
        output.md
        changes.patch
        model-inventory.json
        versions.json
        container-state.json
        result.json
      bad/
        ...same evidence...
  comparison.json
  report.md
```

Use per-session/per-turn input files where a trial has multiple inputs. The manifest
records the run ID, timestamps, source/fixture hashes (including uncommitted inputs),
image digest, CLI versions, model catalog snapshot, resolved config, execution order,
repetition, and cache condition. Setup failures may only produce controller logs,
status, and an incomplete report. Partial evidence is retained after failed runs.

Each result records acceptance per criterion; session/turn IDs; requested and actual
models (including workers); effort and tools; input/cache-read/cache-write/output
tokens using the provider's definitions; measured cost and units; model/tool calls;
workers and iterations; elapsed time; exit status; cap hits; output size; and file
changes. Missing fields are `null` (unknown). Usage prefers the final cumulative
`session.shutdown` summary per session; it is never added to per-call
`assistant.usage` totals. If a shutdown summary is missing, available per-call usage
is retained but cost is marked incomplete. Raw nano-AIU values remain in their
reported units; no dollar or AI-credit conversion is assumed. Avoid double-counting
reasoning or cache tokens already included in other totals.

The comparison reports paired acceptance, total measured spend, cost per accepted
completion, latency, and the observed differences. Link claims to raw evidence and
keep hypotheses separate from measured findings. Generated trial evidence should
remain local/ignored unless deliberately reviewed for publication.

## Authenticated model inventory

[dump-models.mjs](dump-models.mjs) calls the Copilot SDK's authenticated `listModels()`
endpoint without creating a conversation or sending an inference request. It writes:

- [model-inventory.json](model-inventory.json): all model metadata returned by the
  catalog, with capture time and connected CLI version.
- [model-inventory.md](model-inventory.md): the same entries grouped by reported
  vision and configurable-reasoning support, with context limits, supported efforts,
  policy state, and any reported billing multiplier.

Unknown capabilities stay unknown; Auto is a routing entry, not a fixed model.
The snapshot reflects the authenticated CLI catalog, not all VS Code providers,
BYOK configurations, or proof that every entry will accept an inference request.
Policy-disabled entries remain visible. Multipliers are catalog metadata, not
measured cost or a capability/quality ranking.

Requirements: Node.js, an installed Copilot CLI, and an existing Copilot login
(`copilot login`). Supply the paths to a compatible SDK module exporting
`CopilotClient` and the CLI executable or JavaScript entry point. The explicit CLI
path avoids accidentally querying an older SDK-bundled CLI. No packages are
installed by the script.

For this machine's npm-global Copilot installation, PowerShell:

```powershell
$sdk = Join-Path $env:APPDATA 'npm\node_modules\@github\copilot\copilot-sdk\index.js'
$cli = Join-Path $env:APPDATA 'npm\node_modules\@github\copilot\npm-loader.js'
node .\tests\dump-models.mjs $sdk $cli
```

The bundled SDK location is version/installation-specific. For another installation,
pass its SDK and CLI entry points explicitly rather than assuming these paths exist.
An optional third argument selects the output directory. Authentication,
empty-catalog, and cleanup errors fail explicitly; account names and tokens are not
exported. Re-run to refresh the snapshot before choosing experiment model mappings.
