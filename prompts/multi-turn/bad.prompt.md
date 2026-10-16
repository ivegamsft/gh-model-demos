---
id: multi-turn/bad
pattern: multi-turn
variant: bad
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
  Requirements arrive late, so it searches broadly, edits on assumptions, then
  reverts. Each turn replays a growing history that includes discarded work.
expected_result: >
  Possibly an eventual fix, but more turns, more tokens, and a higher chance of a
  changed payment API or leftover unrelated edits.
---
Checkout is broken in fixtures/checkout-app/. Fix it.
<!-- turn -->
No, I meant the mobile flow.
<!-- turn -->
It only happens after a timeout.
<!-- turn -->
Why did you change the payment API? Undo that and try again.
