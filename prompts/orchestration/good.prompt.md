---
id: orchestration/good
pattern: orchestration
variant: good
workload: orchestration
interaction: headless
config:
  surface: copilot-cli
  model_class: strong          # orchestrator
  reasoning_effort: medium
  tools: default
  subagent_model_class: light  # workers
  subagent_mechanism: subagents-or-fleet   # record which was used
caps:
  max_ai_credits: 200
  timeout_minutes: 45
fixtures:
  - fixtures/deprecated-api/
acceptance:
  - All deprecated calls in the three modules are replaced
  - The shared utility is changed once, not by multiple workers
  - Full test suite passes after the final merge
  - Three or fewer workers; no overlapping file sets
  - No unrelated changes
expected_processing: >
  The orchestrator inventories call sites, changes the shared utility itself, then
  assigns disjoint module file sets to up to three light-model workers with a
  precise brief. Workers return short summaries, and the orchestrator runs the
  suite once at the end.
expected_result: >
  Parallel, non-conflicting changes with a small orchestrator context. Compare
  total cost and wall-clock time against a single-agent baseline using the same
  task.
---
Goal: replace the deprecated `legacy_fetch()` API with `fetch_v2()` in
fixtures/deprecated-api/.

As orchestrator:
1. Inventory call sites by module. Do not edit yet.
2. If the shared utility in src/common/ needs changes, make them yourself
   first, so no worker touches it.
3. Delegate at most three workers, one per module, on a light model. Each
   brief must include: the exact file list it owns (disjoint from others),
   the replacement rule, "do not edit files outside your list", "run only
   your module's tests", and "return at most 100 words: files changed, test
   result, problems".
4. If a module has two or fewer call sites, do it yourself instead of delegating.
5. After workers finish, run the full test suite once. Fix integration
   failures yourself. Do not re-delegate.
Return a short report: modules, who changed them, final test result. Stop.
