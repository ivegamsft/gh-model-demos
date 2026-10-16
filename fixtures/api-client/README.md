# API client

Run `npm test` (three passing compatibility tests).
`createClient({baseUrl, transport}).get(path)` uses an injected async transport
with the signature `(url, requestOptions) -> {status, body}`. No network calls
are made by this fixture. Options currently include method and headers;
transports may support an `AbortSignal` when supplied.

The client has no timeout yet. Add an optional timeout in milliseconds, default
30,000, using the existing configuration and `ApiError` reporting style.
Test default configuration, custom duration, and a transport that never resolves
unless aborted. Keep omitted-option callers working and do not add dependencies.
