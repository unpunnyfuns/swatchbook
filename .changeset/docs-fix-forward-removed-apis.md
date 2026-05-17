---
"@unpunnyfuns/swatchbook-core": patch
---

Closes #821. Docs fix-forward — the reference and architecture pages no longer describe APIs that no longer exist.

- `apps/docs/docs/reference/core.mdx` — drops the `projectCss()` and `resolvePermutation()` sections (both removed in earlier v0.55 PRs); drops the `permutationsResolved` field from the `Project` shape; documents `project.resolveAt(tuple)` + `project.defaultTokens` + `project.varianceByPath` + the cells/jointOverrides primitives + `emitAxisProjectedCss` in their place.
- `apps/docs/docs/reference/axes.mdx` — drops the `maxPermutations` historical-guard mention.
- `apps/docs/docs/reference/token-pipeline.mdx` — example import now reads `cells, jointOverrides, defaultTuple, axes, diagnostics, css` (the actual virtual-module exports).
- `apps/docs/docs/developers/architecture.mdx` — `Project` shape updated; static-build data-flow diagram swaps `projectCss` for `emitAxisProjectedCss` and mentions the compound joint blocks.

Patch changeset per project policy so the docs snapshot rebuilds on next release — without the bump, the fix only reaches `/next/`, not `/`.
