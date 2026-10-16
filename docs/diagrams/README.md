# Concept diagrams

Standalone SVG diagrams that illustrate the cost concepts in `docs/`. Each diagram is embedded in the Markdown doc listed below and renders directly on GitHub.

| Diagram | Type | Used in | Source of the facts |
|---|---|---|---|
| [cost-levers-quadrant.svg](cost-levers-quadrant.svg) | Quadrant | [model-usage-cost-optimization.md](../model-usage-cost-optimization.md) | Adoption order in that doc; positions are qualitative |
| [prompt-cache-layers.svg](prompt-cache-layers.svg) | Layer stack | [prompt-caching-guidance.md](../prompt-caching-guidance.md) | Exact-prefix caching behavior described in that doc |
| [multi-turn-cache-growth.svg](multi-turn-cache-growth.svg) | Line chart | [ai-workloads-cost.md](../ai-workloads-cost.md) | Worked example: S = 10,000, h = 2,000, n = 20, reads 0.1×, writes 1.25× |
| [workload-token-multipliers.svg](workload-token-multipliers.svg) | Bar chart | [ai-workloads-cost.md](../ai-workloads-cost.md) | Anthropic, "How we built our multi-agent research system" |
| [routing-layers.svg](routing-layers.svg) | Layer stack | [model-selection-and-execution-shapes.md](../model-selection-and-execution-shapes.md) | Routing-layer table in that doc |
| [foundry-model-router-flow.svg](foundry-model-router-flow.svg) | Flowchart | [model-selection-and-execution-shapes.md](../model-selection-and-execution-shapes.md) | Microsoft Foundry Model Router documentation cited in that doc |
| [cascade-flow.svg](cascade-flow.svg) | Flowchart | [model-selection-and-execution-shapes.md](../model-selection-and-execution-shapes.md) | Cascade expected-cost formula in that doc |
| [progressive-disclosure-pyramid.svg](progressive-disclosure-pyramid.svg) | Pyramid | [frontmatter-and-scripts.md](../frontmatter-and-scripts.md) | Agent Skills specification; Anthropic skill docs |

## Regenerate

All SVGs come from one script. Edit the script, not the SVG files:

```powershell
python docs\diagrams\build_diagrams.py
```

The script checks the multi-turn totals (580,000 and 113,200) and the text contrast ratios before writing.

## Style

These diagrams follow the conventions of [cathrynlavery/diagram-design](https://github.com/cathrynlavery/diagram-design) (MIT):

- 4px grid
- orthogonal connectors
- at most two accent elements per diagram
- node budgets of 9 or fewer
- a legend strip at the bottom
- `role="img"` with `<title>` and `<desc>`

The colors are a GitHub Primer-like neutral skin:

| Token | Value |
|---|---|
| paper | `#f6f8fa` |
| ink | `#1f2328` |
| muted | `#59636e` |
| rule | `#d1d9e0` |
| accent | `#bc4c00` |
| link | `#0969da` |

Fonts are system stacks only, because GitHub renders SVG through `<img>` without web fonts.

**Deviation from the skill:** diagram-design treats HTML as the source and exports SVG from it. Here the generator writes SVG directly so the docs stay Markdown + SVG only.
