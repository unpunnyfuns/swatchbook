---
"@unpunnyfuns/swatchbook-core": minor
"@unpunnyfuns/swatchbook-addon": patch
"@unpunnyfuns/swatchbook-blocks": patch
"@unpunnyfuns/swatchbook-switcher": patch
"@unpunnyfuns/swatchbook-mcp": patch
"@unpunnyfuns/swatchbook-integrations": patch
---

`@unpunnyfuns/swatchbook-core`: legacy cartesian-era code paths deleted.

Removed (pre-1.0 minor bump):

- `analyzeAxisVariance()` function + its `@unpunnyfuns/swatchbook-core/variance` subpath export. Replaced by `Project.varianceByPath`, the load-time-built `ReadonlyMap<string, AxisVarianceResult>` consumed by the smart CSS emitter, the MCP `get_axis_variance` tool, and the `AxisVariance` doc block. Read `project.varianceByPath.get(path)` directly.
- `buildJointOverrides()` shim (deprecated wrapper around `probeJointOverrides`, no non-test callers).
- Internal `emitCss()` (the 200-line cartesian-fan-out CSS emitter) — replaced by `emitAxisProjectedCss()` in v0.54.
- Internal `composeProjectCss()` from `@unpunnyfuns/swatchbook-addon` (`@internal` test-only re-export of `emitAxisProjectedCss`).

Type-only kept on the barrel: `AxisVarianceResult` + `VarianceKind` (relocated from `variance.ts` into `types.ts` since they're load-bearing for `Project.varianceByPath` and the wire-format shape).

Migration: replace `analyzeAxisVariance(path, ...)` with `project.varianceByPath.get(path)`. Replace `buildJointOverrides(...)` with `probeJointOverrides(...).overrides`.

Docs site updated to document `project.varianceByPath` instead of the removed function.
