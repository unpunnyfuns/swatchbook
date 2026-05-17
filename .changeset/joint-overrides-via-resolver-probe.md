---
"@unpunnyfuns/swatchbook-core": patch
"@unpunnyfuns/swatchbook-addon": patch
"@unpunnyfuns/swatchbook-blocks": patch
"@unpunnyfuns/swatchbook-switcher": patch
"@unpunnyfuns/swatchbook-mcp": patch
"@unpunnyfuns/swatchbook-integrations": patch
---

`@unpunnyfuns/swatchbook-core`: rewrite the joint-overrides build to probe via `resolver.apply` directly instead of iterating `permutationsResolved`. New `probeJointOverrides` returns two derived signals from one probe pass:

- `overrides` — partial-tuple divergences (fed into `resolveAt` so cell composition reproduces the cartesian-correct value).
- `jointTouching` — per-path axes that genuinely contribute to a joint divergence (separated from cell-composition artifacts; drives variance display).

`buildVarianceByPath` now consumes `jointTouching` directly instead of deriving from `jointOverrides`, fixing the false-positive class where a non-touching axis's cell value overwrote another axis's delta and the override looked like the axis "touched" the token.

Algorithm probes every axis-arity from 2 to N (all-orders), so joint variance at any arity is caught — bounded by `Σ_n C(axes, n) × Π contexts^n`, which is small at typical axis counts but unbounded for pathological fixtures; an arity cap is a future optimization.

Internal-only — `loadProject` still materializes the full cartesian shape into `Project.permutations` + `Project.permutationsResolved`. The cartesian materialization drop is the next PR.
