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

# In a second terminal, substitute the printed results-relative run path.
node .\tests\harness.mjs monitor --run <run-id> --watch

# Regenerate a report from saved evidence, without making model calls.
node .\tests\harness.mjs report --run <run-id>

# Refresh all saved reports and create results/index.md.
node .\tests\harness.mjs report --all

# Five paired trials need a higher aggregate budget than the default.
node .\tests\harness.mjs run --pattern structured-extraction --trials 5 --budget 300

# Focused automated tests, with no model calls.
npm test --prefix .\tests
```

Monitoring shows controller/worker state and live Docker CPU/memory statistics.
The controller prints session/turn progress while running. Reports and raw evidence
are saved under the ignored `results/` directory, grouped by pattern and matrix.
Reports are organized around **what we tested, what we expected, what happened,
and insights/next steps**. They show the prompt contrast, hypothesis provenance,
criterion-by-criterion decisions, response previews, and direct evidence links.
Execution completion, acceptance failure, and outstanding review are separate
outcomes. Costs are displayed in AIU (nano-AIU divided by one billion), not dollars
or AI credits; raw values remain in JSON. Cache imbalances, incomplete telemetry,
and small samples are called out before interpreting economics.

New plans capture hypotheses from prompt frontmatter. For historical plans that
omitted them, reporting uses the current prompt only if its complete source hash
matches the recorded hash, and labels that recovery. Otherwise expectations are
explicitly unavailable. Regenerating reports never reruns inference or rewrites
original attempt results. The run index keeps dry runs and execution failures
separate from measured experiments; it does not pool unrelated smoke tests.
Prompt bodies are sent on stdin, avoiding command-line argument length limits for
large fixture expansions and keeping their text out of process argument listings.

### Sortable result layout and archiving

Standalone runs use `results/<pattern>/run-000001/`. Matrices use
`results/matrices/matrix-000001/`, with their paired evidence beneath
`runs/<pattern>/cell-0001-trial-0001/`. IDs are zero-padded and allocated without
overwriting existing directories. UTC timestamps remain in JSON metadata and
report headers rather than folder names. Keep standard filenames such as
`report.md`, `manifest.json`, and `result.json` inside each evidence directory.

Use the printed results-relative path with `harness.mjs --run`, for example
`--run structured-extraction/run-000001`. Matrix commands use `--matrix matrix-000001`.
The run index discovers both standalone and nested matrix runs.

To migrate an existing flat timestamp-named result collection without inference:

```powershell
node .\tests\migrate-results.mjs
node .\tests\harness.mjs report --all
```

The migration moves evidence, rebases report links, and records old-to-new paths
in `results/locations.json`. Frozen plans, checkpoint IDs, manifests, grades, and
raw evidence retain their original contents; legacy CLI IDs still resolve through
the location registry. Keep that registry when archiving the result collection.
Matrix folders contain their paired evidence and can be archived as a unit.
Links to repository source files require the checkout layout to remain available.
Do not migrate while controllers are running. Regenerating reports does not resume
old matrices; controller hash checks still apply to their frozen plans.

### Model, prompt, instruction, and workload matrix

[matrix.mjs](matrix.mjs) plans one experiment containing multiple paired runs:

- **Models:** the enabled/non-disabled intersection of both authenticated container
  catalogs. Includes Auto and any Hydra/ensemble entry actually present; never
  synthesizes a custom ensemble. Unknown policy state is not proof inference works.
- **Prompt factor:** the existing good/bad pair, with its unchanged shared rubric.
- **Instruction factor:** independently cross `none`, `good`, and `bad` repository
  instruction bundles from [agent-assets/instructions](../agent-assets/instructions/).
  Both prompt variants get the *same* instruction context within a cell. Thus
  good prompts with bad instructions and bad prompts with good instructions are
  measured, not only "everything good" versus "everything bad."
- **Workloads:** discover every prompt-pattern directory and retain its workload
  label. Missing fixtures, unbound tool profiles, or unsupported subagent runners
  become explicit blocked coverage, not quality failures. Default execution refuses
  blocked coverage unless `--allow-partial` is deliberately supplied.
- **Trials/order:** five paired trial rounds by default. Cell order is shuffled
  reproducibly within each round using a saved seed. Pair order alternates by
  trial/cell parity; an odd number of trials cannot be perfectly order-balanced.

```powershell
# No inference: query both catalogs, freeze context contents/hashes and prompts,
# calculate coverage, attempts, sessions, and summed soft-cap budget.
node .\tests\matrix.mjs plan --trials 5

# Smaller bounded smoke plan before a large experiment.
node .\tests\matrix.mjs plan --models gpt-5-mini,auto --patterns structured-extraction --trials 1

# Use the printed matrix ID. This smoke plan reserves 360 AI credits in soft caps.
node .\tests\matrix.mjs run --matrix <smoke-matrix-id> --budget 360

# In another terminal: checkpoint totals, current paired run ID, and report.
node .\tests\matrix.mjs monitor --matrix <matrix-id>
node .\tests\harness.mjs monitor --run <current-paired-run-id> --watch

# Regenerate the aggregate without inference.
node .\tests\matrix.mjs report --matrix <matrix-id>
```

Planning saves `results/matrices/<matrix-id>/plan.json`, `state.json`, `report.md`,
`summary.json`, and `contrasts.json`. Each trial/cell uses a normal evidence-rich
paired run under that matrix's `runs/<pattern>/cell-0001-trial-0001/`.
Factor rows show acceptance/rejection/
review/execution-failure counts, cost per accepted completion (including known
failed spend), total AIU, tokens/cache, latency, staged instruction bytes, and actual
models. Matched prompt and instruction deltas hold other factors fixed. Deltas are
withheld until all planned observations and rubric decisions are available and no
execution failure remains; zero accepted completions never yields a fake zero cost.
After human review, regenerate paired reports (`harness.mjs report --all`) before
regenerating the matrix so reviewed decisions enter the aggregate.
Matched model deltas use `gpt-5-mini` as baseline when selected, otherwise the first
selected model; Auto/provider-default comparisons are explicitly not effort-matched.
Reports identify each selected model's family without extrapolating a representative's
results to its entire family. Saved reports use percent-encoded paths relative to
each Markdown file (including prompt pairs, instruction assets, methodology, and
evidence). Links remain portable when the checkout moves, provided its directory
layout is preserved. Missing historical fixture paths remain diagnostic code, not
links to nonexistent evidence.

Repository instructions are installed beneath `.github/` in the disposable
workspace before its Git baseline. Their exact contents/hashes and
`copilot instruction list --json` discovery evidence are saved per attempt.
`none` supplies no files and disables custom instructions on inference commands.
Discovery and staged byte counts **do not prove every scoped instruction was
attached**, and bytes are not tokenizer counts. Inline tasks may only exercise
always-on instructions. Skills, custom agents, prompt-file activation, and
progressive-disclosure assets are **not** tested by this factor.

Named models retain the prompt's reasoning effort when supported. Auto and models
without effort metadata omit the effort flag and record "provider default; not
effort-matched"; actual routed models come from usage evidence. Unsupported known
efforts block the cell rather than silently substituting a different setting.
CLI updates are disabled; the image ID, driver hashes, catalogs, configuration,
prompts, context, and randomized schedule are frozen. Replan after changing the
driver or image. Provider caching and Auto routing remain uncontrolled confounders.
Five trials support exploration, not a statistically established overall winner.
Preflight/run also retain a content-specific Docker tag under
`gh-model-experiment-pins` so rebuilding the mutable development tag cannot make
the recorded image unreachable. These pins consume local disk until explicitly
removed after all dependent experiments finish. Checkpoint JSON replacement
retries transient `EPERM`/`EBUSY`/`EACCES` locks with bounded backoff and logs every
retry; permanent errors still stop the controller and preserve original evidence.
An interrupted experiment can deliberately adopt a corrected host controller with
`run --matrix <id> --budget <original-budget> --accept-controller-update`. This
records old/new hashes and remaining jobs in `controller-updates.json`, retains the
original immutable container image and inputs, and labels the mixed controller
provenance in the report. It never replaces the frozen plan hashes or reruns
completed/failed jobs. Without this flag a driver mismatch still blocks execution.

Use `node .\tests\matrix.mjs refresh --matrix <old-matrix-id>` after adding missing
fixtures or runner bindings. This creates a new no-inference plan against current
configuration/catalogs/image and links it from the old report. Old frozen blockers,
hashes, budgets, and results remain unchanged; the old report displays current
prerequisites alongside its historical assessment rather than silently rewriting
experimental provenance. A refresh does not launch either plan.
Pattern readiness and per-model effort compatibility are distinct. For example,
`kimi-k3` advertises low/high/max but not medium: cells requesting medium remain
explicitly excluded even after every fixture and runner prerequisite is supplied.
Their exact reason/count appears in the report; no effort is silently substituted.

The numeric `--budget` must cover the **entire** frozen matrix's summed session
caps, not just the current job. These are soft admission limits, not a predicted
bill or guaranteed hard ceiling; AI credits, AIU, and dollars are not interchangeable.
For example, the historical 3-pattern subset with 25 catalog models,
3 instruction contexts, and 5 trials schedules 2,250 attempts, reserving 75,000
credits in soft caps. That plan predated fixtures and runner bindings for the
other 13 patterns. Always refresh the plan rather than treating historical
blocked coverage as the current readiness assessment.

Rerunning `run` with the same ID resumes only pending jobs; completed and failed
jobs are never automatically retried or silently replaced. An exclusive runner
lock prevents simultaneous controllers. SIGINT/SIGTERM uses the paired controller's
scoped cleanup. After a hard crash, an in-flight/uncertain checkpoint or stale
`runner.lock` deliberately prevents automatic resume: inspect the specific process,
container names in the paired manifest, status, and evidence before resolving it.
Do not mark an uncertain job pending merely to retry it; that could duplicate spend.
Preserve the evidence and create a separately budgeted follow-up plan instead.

### Configuration and current coverage

For an explicit HydraFusion/Ensemble paired run, map the desired model classes
to `hydrafusion` and set `enableHydrafusion: true` in a separate configuration.
Workers enable `HYDRAFUSION_ROLLOUT`, use experimental mode and default context,
and require `session.fusion_resolved` evidence before marking execution successful.
This synthetic orchestration treatment is not advertised by `listModels()` and
is not automatically added to catalog-based matrices. An explicitly opted-in
configuration can select it using `matrix.mjs plan --models hydrafusion`.
Reasoning effort is managed
by HydraFusion and is explicitly not effort-matched to the prompt's requested
effort. Matrix workers request the same synthetic model: homogeneous orchestration,
not light/strong tier routing. Trial-one worker treatments run first as validation
gates. Both variants must actually spawn workers reporting `hydrafusion`; missing
or mismatched evidence stops further dispatch, preserving all attempts.

The full homogeneous treatment uses [config-hydrafusion.json](config-hydrafusion.json):

```powershell
node .\tests\matrix.mjs plan --config .\tests\config-hydrafusion.json --models hydrafusion --contexts none --trials 5
node .\tests\matrix.mjs run --matrix <matrix-id> --budget 12800
```

This plans 16 patterns, 80 paired jobs, 200 attempts (including classification
repetitions), and 205 sessions. The 12,800-credit aggregate is a soft-cap
reservation, not expected spend. Approve it explicitly before execution.

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
- Declared workload fixtures are supplied under `fixtures/` and have independent
  shape/baseline checks in `fixtures.test.mjs`. A new matrix plans all 16 patterns.
  Fixture
  symlinks and paths escaping the repository are rejected. Fixture source hashes
  must match across variants.
- `none` exposes an empty tool list; `read-only` exposes `view`, `glob`, and `grep`;
  `web` exposes `web_fetch`; `default` permits ordinary CLI tools
  inside the disposable container. Built-in MCP servers are disabled.
- `mock-observability` launches a local, read-only stdio MCP server exposing only
  synthetic `metrics`, `deployments`, and `logs` datasets. Query parameters/results
  are saved in `mock-observability.jsonl`. Logs are bounded by `limit` (1..1000),
  with a default 100; the rubric's <=20 requirement is graded from query evidence,
  not forcibly imposed in the bad variant.
- `read-only+shell-test` exposes file readers and `bash`, permits `node --test` and
  `npm test`, and denies file-write tools and Git shell commands. This is a tool
  permission policy for trusted fixtures, not a filesystem sandbox: a test script
  itself can have side effects. Do not use untrusted scripts.
- Worker-model patterns install per-built-in-agent model settings in the ephemeral
  CLI home and read them back before inference. Research uses native subagents;
  orchestration enables `--fleet`. Evidence records worker settings and observed
  subagent/model events. In model matrices the same selected model is used for
  lead and workers; a direct paired run uses configured light/strong mappings.
  This intentionally measures a homogeneous model treatment, not genuine tier
  routing. The separate agent-assets skill/agent library remains inactive.
- `HARNESS_AUTH_TESTS=1` enables an additional Docker/SDK handshake test for the
  mock MCP server and worker settings using the good device-auth volume. It creates
  a session but sends no prompt and performs no inference. Ordinary fixture and
  mock-protocol tests require neither Docker nor authentication.
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
  no automatic retries. Worker-model orchestration uses CLI session controls, not a separate
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
results/<pattern>/run-000001/
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
