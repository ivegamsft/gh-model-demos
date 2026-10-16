# Metric definitions

- **input_tokens:** total prompt tokens as reported by the provider. Some providers include cached tokens in this total; others report them separately. Record which convention the log uses before adding fields together.
- **cached_tokens:** prompt tokens served from cache. Cheaper than ordinary input, not free.
- **output_tokens:** generated tokens. Some providers include reasoning tokens here.
- **accepted:** whether the run passed the shared acceptance criteria for the task.
- **tokens per accepted completion:** (input + output across all runs, including failures) / accepted runs. Undefined when no run is accepted.

Compare configurations only for the same `task_id`, fixture, and acceptance criteria.
