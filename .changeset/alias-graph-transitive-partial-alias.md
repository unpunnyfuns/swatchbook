---
'@unpunnyfuns/swatchbook-core': patch
---

Make `expandReach` recursively chase `partialAliasOf` targets so the alias-graph captures composite tokens' full transitive reach. Previously, a composite C whose `partialAliasOf` referenced a primitive X stopped at X — if X itself aliased onward to Y (via `aliasChain`), Y was missing from C's reach set, causing axes that wrote Y to be falsely classified as orthogonal to axes that wrote C. The probe could silently skip the corresponding combinations.

Single-hop `aliasChain` walks remain — Terrazzo already populates that chain transitively, so one read captures the full sequence. Only `partialAliasOf` needed the recursive treatment, since each composite carries only its immediate sub-field targets. Cycle protection via the existing reach-set dedup; cost is the per-token transitive closure depth, negligible in practice.

Configs with shallow alias topology (no composite-through-primitive-through-alias chains) see no behavior change. Configs with such chains gain coverage on previously mis-culled axis pairs at the cost of running those previously-skipped probes — a correctness fix paid for in `resolver.apply` calls only on configs that needed it.
