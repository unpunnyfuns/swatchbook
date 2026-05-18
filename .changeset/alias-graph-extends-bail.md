---
'@unpunnyfuns/swatchbook-core': patch
---

Conservatively widen alias-graph connectivity when a modifier uses DTCG `$extends`. Terrazzo's `loadResolver` leaves `$extends` directives un-flattened in `resolver.source.modifiers` (flattening runs lazily inside `apply()`), so a literal walk of the modifier source misses inherited token paths. Rather than silently mis-cull a real joint divergence, an axis whose overlays use `$extends` is now marked wildcard-connected — connected to every other axis, giving up the orthogonality skip but preserving correctness.

Configs without `$extends` (including the reference and stress fixtures) are unaffected. Configs that adopt `$extends` keep their pair-and-up correctness; speedup degrades on the affected axes only. Active `$extends` expansion (recovering the speedup) remains tracked as future work.
