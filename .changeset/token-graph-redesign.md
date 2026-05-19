---
'@unpunnyfuns/swatchbook-core': minor
'@unpunnyfuns/swatchbook-addon': minor
'@unpunnyfuns/swatchbook-blocks': minor
'@unpunnyfuns/swatchbook-switcher': minor
'@unpunnyfuns/swatchbook-integrations': minor
'@unpunnyfuns/swatchbook-mcp': minor
---

Replace `Project.cells` + `Project.jointOverrides` + `Project.varianceByPath` with a single walkable `Project.tokenGraph`. Per-tuple resolution is now a pure graph walk; `resolver.apply` is called at most Σ(axes × non-default contexts) + 1 times at `loadProject` time, never per-tuple. On a real consumer workload that previously triggered 15M+ `resolver.apply` calls, this is the structural fix.

**Breaking (pre-1.0, minor bump per project semver):**

- `Project.cells`, `Project.jointOverrides`, `Project.varianceByPath` are removed. Use `Project.tokenGraph` + helpers from the new `@unpunnyfuns/swatchbook-core/graph` subpath:
  - `resolveAt(graph, path, tuple)` — resolved leaf value
  - `resolveAllAt(graph, tuple)` — full TokenMap
  - `resolveAliasAt(graph, path, tuple)` — alias-preserving view (token with `aliasOf` populated)
  - `resolveAliasAllAt(graph, tuple)` — full TokenMap with alias-preserving view
  - `getVariance(graph, path)` — same `AxisVarianceResult` shape consumers had before
  - `getAffectedBy(graph, path)` — set of axes that can change this path's value
  - `listPaths(graph)` — sorted path universe
- `Project.resolveAt(tuple)` signature unchanged; backed by the graph walker internally.
- `@unpunnyfuns/swatchbook-core/resolve-at` subpath is removed. Use `@unpunnyfuns/swatchbook-core/graph` — same `resolveAt`-ish helpers, but parameterised over a `TokenGraph` instead of constructed against `cells + jointOverrides`.
- MCP `get_axis_variance` wire shape is unchanged.

**Internal:** `cells.ts`, `joint-overrides.ts`, `alias-graph.ts`, `resolve-at.ts`, `variance-by-path.ts`, `variance-analysis.ts` are deleted. Variance classification used by the smart CSS emitter is now an unexported helper inside `css-axis-projected.ts`.

**Performance:** synthetic baseline on the reference fixture shows `buildTokenGraph` at 0.39 ms vs `buildCells + probeJointOverrides + buildVarianceByPath` at 3.24 ms — 8.24× faster. Real-consumer workload not measured in this branch; baselines tracked in `packages/core/bench/token-graph.bench.ts` for future regression-tracking.
