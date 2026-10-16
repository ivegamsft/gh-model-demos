# Three-module migration

Run `npm test` (all three module tests pass).
Focused checks: `node --test test/billing.test.mjs`,
`node --test test/inventory.test.mjs`, `node --test test/reports.test.mjs`.

Each module owns one `src/<module>/index.mjs` and its test; each has three
deprecated calls. Only the orchestrator owns `src/common/`.

Migration contract: introduce `fetch_v2(resource, {query = {}} = {})` in the
shared adapter, using `transport.requestV2`; return `response.body` as the
same row array returned previously. Replace
`legacy_fetch({resource: R, params: P})` with `fetch_v2(R, {query: P})`.
The in-memory transport exposes both versions to make behavior-preserving
migration possible without dependencies or network. Do not change domain APIs.
