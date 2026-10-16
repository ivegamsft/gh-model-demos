# Long-context design brief

`design-doc.md` is generated source, with 100 numbered sections, exactly three
explicit decisions, two stated open risks, and one explicitly deferred item.
The content concerns model-usage optimization and contains no external pricing
claims. Only the document is needed for the summarization task.

No npm application. From the repository root:
`node fixtures/generate.mjs --check` and
`node --test tests/fixtures.test.mjs`.
Regenerate with `node fixtures/generate.mjs`.
See the parent fixture README for actual tokenizer measurement commands.
The checked-in document measures 39,943 `cl100k_base` tokens, not 40,000 words.
