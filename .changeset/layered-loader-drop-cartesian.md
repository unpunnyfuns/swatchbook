---
"@unpunnyfuns/swatchbook-core": minor
"@unpunnyfuns/swatchbook-addon": patch
"@unpunnyfuns/swatchbook-blocks": patch
"@unpunnyfuns/swatchbook-switcher": patch
"@unpunnyfuns/swatchbook-mcp": patch
"@unpunnyfuns/swatchbook-integrations": patch
---

`@unpunnyfuns/swatchbook-core`: the **layered loader** now enumerates `Σ(axes × contexts)` singleton tuples — the default tuple plus one per `(axis, non-default-context)` — instead of `Π(contexts)` cartesian tuples. Symmetric with the resolver path after #810. Joint divergences are unrecoverable without a resolver, so the truth model for layered is projection composition over delta cells; `composeAt` at any multi-non-default tuple applies each axis's delta on top of the baseline in axis order.

The `Config.maxPermutations` guard is **removed**. With singleton enumeration, the loader is intrinsically bounded by axis cardinality regardless of cartesian size — there's nothing left to guard against.

Public API removed (pre-1.0 minor bump):

- `Config.maxPermutations` field.
- `cartesianSize()` export.
- `permutationGuardDiagnostic()` export.
- `DEFAULT_MAX_PERMUTATIONS` export.
- The `swatchbook/permutations` warn diagnostic group.

Migration: drop `maxPermutations` from your swatchbook config. The reference `axes.mdx` / `config.mdx` docs reflect the new scoping levers (`presets`, `disabledAxes`).
