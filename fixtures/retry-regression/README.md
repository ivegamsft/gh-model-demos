# Retry regression

Run `npm test` (two pass, one intentional regression failure).
Focused reproduction:
`node --test --test-name-pattern="retry-timeout" test/retry.test.mjs`.
The test injects timers and explicitly triggers the timeout: no wall-clock
sleep or external service is involved. The transport rejects with the abort
reason and honors an already-aborted signal. Existing tests must remain intact.
