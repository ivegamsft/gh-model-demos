# Checkout reproduction

The payment adapter's public contract is
`charge({cartId, idempotencyKey}) -> Promise<{id, cartId, status}>`.
It deduplicates by idempotency key. A response timeout can follow a successful
commit. This in-memory adapter simulates that sequence without sleeping.
Mobile and desktop entry points are in `src/checkout`; the synthetic timeout
trace is in `logs/timeout.log`.

Run `npm test` (two pass, one intentional mobile regression failure).
Focused reproduction:
`node --test --test-name-pattern="mobile timeout" test/checkout.test.mjs`.
Preserve the payment contract and desktop behavior when repairing retry state.
