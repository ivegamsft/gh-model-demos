# Model usage test harness

## Status and purpose

This directory defines the planned test harness and its methodology. **The Docker
image and controller are not implemented yet.** The model inventory script is
implemented and can run independently; it does not send prompts or run tests.

Measure whether the paired [prompt patterns](../prompts/README.md) and
[agent assets](../agent-assets/README.md) improve cost, quality, and reliability.
`good` and `bad` are experimental labels, not proven outcomes. The primary measure
is **total cost per accepted completion**, not shortest output or lowest token count.

## Architecture

```text
Host: control script (planned)
  |
  +-- good container: gh + Copilot CLI + good prompt/assets + fixture copy
  +-- bad container:  gh + Copilot CLI + bad prompt/assets + fixture copy
  |
  +-- evidence from both containers -> shared acceptance grader -> paired report
```

The controller starts two fresh, separately named containers per paired trial.
Both use the same pinned image, GitHub CLI (`gh`), Copilot CLI, runtime dependencies,
resource limits, and fixture snapshot. `gh` alone is not a model runner: install
Copilot CLI as well and verify `gh copilot -- --help` in the image.

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
8. Always collect available evidence and remove the trial's containers, networks,
   and temporary credentials, including when setup, execution, or grading fails.

### Isolation and authentication

- Use disposable, non-privileged containers with CPU, memory, and process limits.
  No Docker socket, host home directory, host credentials, or production access.
- Keep authentication outside the model-accessible workspace. Prefer a
  controller-owned credential boundary that permits only required inference.
  Do not assume that an environment token or secret mount is hidden from shell tools.
  If that boundary is unavailable, block sandbox-only agentic trials rather than
  expose credentials to the bad variant.
- Restrict network access to the experiment's required services. Web research
  trials need an explicitly recorded exception; mock external tools where possible.
  Do not grant repository push access.
- Enforce tool allowlists in the runner, not just prompt text. Do not indiscriminately
  enable all tools. A container is not a complete security boundary.
- Treat `max_ai_credits` as a soft session limit. Also enforce wall-clock limits
  and an aggregate experiment budget across phases, repetitions, retries, and workers;
  do not promise an exact hard billing cutoff.
- Keep credentials and authorization headers out of all evidence and reports.

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

Planned output layout (not yet produced by a controller):

```text
results/<run-id>/
  manifest.json
  good/
    input.md
    events.jsonl
    stdout.log
    stderr.log
    changes.patch
    result.json
  bad/
    ...same evidence...
  comparison.json
  report.md
```

Use per-session/per-turn input files where a trial has multiple inputs. The manifest
records the run ID, timestamps, source/fixture hashes (including uncommitted inputs),
image digest, CLI versions, model catalog snapshot, resolved config, execution order,
repetition, and cache condition.

Each result records acceptance per criterion; session/turn IDs; requested and actual
models (including workers); effort and tools; input/cache-read/cache-write/output
tokens using the provider's definitions; measured cost and units; model/tool calls;
workers and iterations; elapsed time; exit status; cap hits; output size; and file
changes. Missing fields must be explicitly unknown. Avoid double-counting reasoning
or cache tokens already included in other totals.

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
