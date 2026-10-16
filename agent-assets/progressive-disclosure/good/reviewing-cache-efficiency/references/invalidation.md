# Cache invalidation causes

| Symptom | Likely cause | Test |
|---|---|---|
| Drop right after a model switch | Caches are per model | Keep one model per session; use a subagent for other models |
| Drop after an effort or tool change | Prefix or request settings changed | Set effort and tools before the session starts |
| Drop after a long pause | Cache lifetime expired | Compare gaps against the provider's documented retention |
| Drop on every call | Volatile text early in the prompt, such as a timestamp | Move variable content to the end |
| Drop after editing instructions or skills | Always-loaded prefix changed | Batch customization edits between sessions |

Retention and minimum cacheable length vary by provider and model; check the provider's current caching documentation.
