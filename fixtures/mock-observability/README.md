# Offline staging telemetry

Three generated JSON arrays are the read-only mock tool data source.
All times are UTC ISO-8601; date 2026-10-14; target service `staging-api`.

- `metrics.json`: `{timestamp, service, p95_latency_ms, error_rate, request_count}`.
  Error rate is a fraction, not a percentage; samples are one minute apart.
- `deployments.json`: `{deployed_at, service, deployment_id, version, change}`.
  A deployment is active from its timestamp until the next deployment for that
  service. A time-window query needs the predecessor active at its start.
- `logs.json`: `{timestamp, service, level, event, deployment_id, message}`.
  Error records also have `{pool_limit, wait_ms, request_id}`.

Metrics cover 13:45-14:30. The spike is 14:00-14:15 inclusive.
The service and unrelated worker have separate telemetry. Sort/filter by the
named timestamp fields and service; honor the requested record limit. There are
48 relevant error records, intentionally more than the allowed 20-record query.
Every identifier and message is synthetic. No credential-like strings or
personal data are seeded. Correlated timestamps do not prove causality.

No npm application or server is started by the fixture. The harness owns the
mock MCP tools. From the repository root:
`node fixtures/generate.mjs --check` and
`node --test tests/fixtures.test.mjs`.
