# Provider usage fields

Field names change; confirm against current provider documentation before relying on this table.

| Provider API | Cached tokens field | Included in input total? |
|---|---|---|
| OpenAI | `usage.prompt_tokens_details.cached_tokens` (Chat Completions) or `usage.input_tokens_details.cached_tokens` (Responses) | Yes, a subset of input |
| Anthropic | `usage.cache_read_input_tokens`; writes in `usage.cache_creation_input_tokens` | No, reported separately from `input_tokens` |

Cache read ratio = cached tokens / total prompt tokens, where total prompt tokens is computed according to the provider's convention above.
