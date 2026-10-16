# Small API

Run `npm test` (three passing existing tests).
`createHttpHandler()` is a Node HTTP adapter; tests use the same `createApp().handle`
pipeline directly, without binding a port. Authentication is existing middleware.
The injected `now()` returns milliseconds for deterministic window tests.
Each app instance represents one process; distributed coordination is out of scope.

There is currently no rate limiting. Add a per-API-key limit of 100 requests in
60 seconds and HTTP 429 with `Retry-After` in seconds. Keep authorized responses
and authentication behavior intact. New tests should include the 100th/101st
boundary, independent keys, and the window reset using the injected clock.
