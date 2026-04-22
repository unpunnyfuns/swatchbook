---
'@unpunnyfuns/swatchbook-mcp': minor
'@unpunnyfuns/swatchbook-core': patch
'@unpunnyfuns/swatchbook-blocks': patch
---

Add `get_axis_variance` MCP tool + extract the variance algorithm into `@unpunnyfuns/swatchbook-core` (`analyzeAxisVariance`). The algorithm now lives in one place and drives both the `AxisVariance` doc block and the new MCP tool, which classifies a token's axis dependence (`constant` / `single` / `multi`) and returns the per-axis breakdown of values seen in each context.
