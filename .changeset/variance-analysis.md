---
"@unpunnyfuns/swatchbook-core": minor
"@unpunnyfuns/swatchbook-addon": minor
"@unpunnyfuns/swatchbook-blocks": minor
"@unpunnyfuns/swatchbook-switcher": minor
"@unpunnyfuns/swatchbook-mcp": minor
"@unpunnyfuns/swatchbook-integrations": minor
---

`@unpunnyfuns/swatchbook-core`: add internal `analyzeProjectVariance(project)` that classifies every token by how it varies across axes — baseline-only, single-axis, orthogonal-after-probe, or joint-variant. First step of a planned smart-emitter rewrite that routes per-token between projection (orthogonal) and compound-selector emit (joint-variant). Analysis only; no emit behaviour changes in this release. Not exported from the public API yet.
