# Offline workload fixtures

These are deliberately unfinished starting points, not production examples.
Use Node.js 22 or later. No fixture needs installation, credentials, network
access, a database, or a third-party runtime dependency. Run commands from the
fixture directory unless stated otherwise. Copy fresh fixtures for each trial;
never repair the checked-in baseline to make the validation suite green.

`checkout-app`, `retry-regression`, and `ci-failure` each intentionally have one
failing regression. The other applications' existing public tests pass.
The external fixture audit expects those failures:

```powershell
node --test tests\fixtures.test.mjs
```

Run that command from the repository root. Keep `tests\fixtures.test.mjs`
outside model workspaces: it contains independent behavioral and content oracles.
Do not hand its expected results to a model as task context.

Long and batch assets and observability data are checked-in generated sources:

```powershell
node fixtures\generate.mjs
node fixtures\generate.mjs --check
```

The generator is deterministic and offline. The long document has exactly three
recorded decisions; other sections are supporting review observations, not
additional decisions. Token measurements use the actual `cl100k_base` tokenizer,
not a word-count estimate. With Python `tiktoken` available:

```powershell
python -c "from pathlib import Path; import tiktoken; e=tiktoken.get_encoding('cl100k_base'); print({str(p): len(e.encode(p.read_text(encoding='utf-8'))) for p in [Path('fixtures/long-context/design-doc.md'), Path('fixtures/batch-classification/label-guide.md')]})"
```

Tokenizer tooling is validation-only; it is not a fixture runtime dependency.
No paid model calls are needed for any fixture checks.
The checked-in document measures **39,943 tokens** and the guide **1,563 tokens**
with `tiktoken` 0.12.0 / `cl100k_base` (LF-normalized UTF-8).
