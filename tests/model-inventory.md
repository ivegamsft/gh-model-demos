# Authenticated Copilot CLI model inventory

Captured: 2026-10-16T03:42:31.272Z
Connected CLI version: 1.0.98
Catalog entries: 25

Source: authenticated Copilot SDK `listModels()`; no inference requests made.
Grouped by declared capabilities, not inferred quality, price, or light/mid/strong tiers.
Unknown means not reported (including zero/unspecified context limits).
Auto is a router. Policy state is not proof of successful inference access.
Billing multipliers are metadata, not measured cost. See [methodology](README.md).

## Automatic routing (1)

| Model ID | Name | Context tokens | Max prompt tokens | Reasoning efforts | Default effort | Policy | Billing multiplier |
|---|---|---:|---:|---|---|---|---:|
| auto | Auto | unknown | unknown | not reported | unknown | unknown | unknown |

## Vision + configurable reasoning (23)

| Model ID | Name | Context tokens | Max prompt tokens | Reasoning efforts | Default effort | Policy | Billing multiplier |
|---|---|---:|---:|---|---|---|---:|
| claude-haiku-5.5 | Claude Haiku 5.5 | 1000000 | 936000 | low, medium, high, xhigh, max | unknown | enabled | unknown |
| claude-opus-4.8 | Claude Opus 4.8 | 1000000 | 936000 | low, medium, high, xhigh, max | unknown | enabled | unknown |
| claude-opus-5 | Claude Opus 5 | 1000000 | 936000 | low, medium, high, xhigh, max | unknown | enabled | unknown |
| claude-opus-5.5 | Claude Opus 5.5 | 1000000 | 1000000 | low, medium, high, xhigh, max | unknown | enabled | unknown |
| claude-sonnet-5 | Claude Sonnet 5 | 1000000 | 936000 | low, medium, high, xhigh, max | unknown | enabled | unknown |
| claude-sonnet-5.5 | Claude Sonnet 5.5 | 1000000 | 936000 | low, medium, high, xhigh, max | unknown | enabled | unknown |
| gpt-5-mini | GPT-5 mini | 264000 | 128000 | low, medium, high | unknown | enabled | unknown |
| gpt-5.3-codex | GPT-5.3-Codex | 400000 | 272000 | low, medium, high, xhigh | unknown | unknown | unknown |
| gpt-5.4 | GPT-5.4 | 1050000 | 922000 | none, low, medium, high, xhigh | unknown | enabled | unknown |
| gpt-5.4-mini | GPT-5.4 mini | 400000 | 272000 | none, low, medium, high, xhigh | unknown | enabled | unknown |
| gpt-5.5 | GPT-5.5 | 1050000 | 922000 | none, low, medium, high, xhigh | unknown | enabled | unknown |
| gpt-5.6-luna | GPT-5.6 Luna | 1050000 | 922000 | none, low, medium, high, xhigh, max | unknown | enabled | unknown |
| gpt-5.6-sol | GPT-5.6 Sol | 1050000 | 922000 | none, low, medium, high, xhigh, max | unknown | enabled | unknown |
| gpt-5.6-terra | GPT-5.6 Terra | 1050000 | 922000 | none, low, medium, high, xhigh, max | unknown | enabled | unknown |
| gpt-6-astra | GPT-6 Astra | 1050000 | 1050000 | low, medium, high, xhigh, max | unknown | enabled | unknown |
| gpt-6-luna | GPT-6 Luna | 1000000 | 872000 | none, low, medium, high, xhigh, max | unknown | enabled | unknown |
| gpt-6-sol | GPT-6 Sol | 1000000 | 872000 | none, low, medium, high, xhigh, max | unknown | enabled | unknown |
| gpt-6.1-sol | GPT-6.1 Sol | 1050000 | 922000 | none, low, medium, high, xhigh, max | unknown | enabled | unknown |
| grok-4.5 | Grok 4.5 | 500000 | 372000 | low, medium, high | unknown | unknown | unknown |
| grok-4.6 | Grok 4.6 | 500000 | 372000 | low, medium, high, xhigh | unknown | unknown | unknown |
| grok-4.7 | Grok 4.7 | 500000 | 372000 | low, medium, high, xhigh | unknown | unknown | unknown |
| kimi-k3 | Kimi K3 | 1048576 | 917504 | low, high, max | unknown | enabled | unknown |
| mai-code-1.1-flash | MAI-Code-1.1-Flash | 256000 | 128000 | low, medium, high | unknown | enabled | unknown |

## Vision; no configurable reasoning (1)

| Model ID | Name | Context tokens | Max prompt tokens | Reasoning efforts | Default effort | Policy | Billing multiplier |
|---|---|---:|---:|---|---|---|---:|
| claude-haiku-4.5 | Claude Haiku 4.5 | 200000 | 136000 | not reported | unknown | enabled | unknown |

