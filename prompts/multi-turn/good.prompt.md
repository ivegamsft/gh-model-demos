---
id: multi-turn/good
pattern: multi-turn
variant: good
workload: multi-turn
interaction: interactive
config:
  surface: copilot-cli
  model_class: mid
  reasoning_effort: medium
  tools: default
caps:
  max_ai_credits: 60
  timeout_minutes: 20
fixtures:
  - fixtures/checkout-app/
acceptance:
  - Regression test for timeout -> Retry -> exactly one order exists and passes
  - Existing checkout tests still pass
  - Payment API contract unchanged
  - No unrelated files changed
expected_processing: >
  Turn 1 gathers focused evidence and returns a diagnosis without editing. Turn 2
  implements the agreed fix and runs focused tests. History stays relevant.
expected_result: >
  An evidence-backed root cause, then a scoped fix with a regression test, in two
  turns.
---
Diagnose a mobile checkout bug in fixtures/checkout-app/; do not edit yet.
After the first payment request times out, tapping Retry sometimes creates
two orders. Desktop checkout is unaffected. Start in src/checkout and the
timeout log in logs/. Preserve the payment API contract.
Return the best-supported cause, evidence locations, and a minimal fix plan.
Ask only for information needed to distinguish plausible causes.
<!-- turn -->
Implement the proposed retry-state fix. Add a regression test for
timeout -> Retry -> one order. Preserve ordinary successful checkout.
Run the focused tests and report any unresolved risk. Do not refactor
unrelated checkout behavior. Stop after the scoped fix and checks.
