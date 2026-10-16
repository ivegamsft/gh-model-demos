# Review snapshot

`change.diff` uses paths relative to this directory; `src` is the post-change
snapshot for confirming findings. Review the diff, not unrelated repository code.
The database interface accepts `query(sql, parameters)` and supports `?`
placeholders. It is injected; no real database or SQL execution is present.

Run `npm test` (two passing existing smoke tests, intentionally insufficient
boundary/input coverage). Independent audit checks live outside this workspace.
Do not execute submitted input against an external database.
