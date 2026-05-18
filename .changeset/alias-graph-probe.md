---
'@unpunnyfuns/swatchbook-core': patch
---

Optimize `probeJointOverrides` to skip orthogonal axis combinations via an alias-reachability graph built from the resolver's parsed source. The graph identifies axis pairs whose token-path reach sets don't intersect — those combinations cannot produce a joint divergence by construction, so the probe spends zero `resolver.apply` calls on them.

Output is byte-identical to the brute-force probe on every existing fixture (verified empirically: reference fixture's known `accent.fg` joint case still detected; algorithmic invariants pinned in unit tests). Configs with concern-disjoint axes (e.g. mode→color, density→dimension) see substantial speedups; configs whose axes all share paths see no savings but no regression.

Internal-only change. No public API additions: `probeJointOverrides` isn't exported, and the new `ProbeOptions { maxArity? }` interface stays internal too.
