---
"@unpunnyfuns/swatchbook-core": patch
"@unpunnyfuns/swatchbook-addon": patch
"@unpunnyfuns/swatchbook-blocks": patch
"@unpunnyfuns/swatchbook-switcher": patch
"@unpunnyfuns/swatchbook-mcp": patch
"@unpunnyfuns/swatchbook-integrations": patch
---

`@unpunnyfuns/swatchbook-blocks`: index permutations by canonical tuple key once per snapshot, exposed as `permutationNameForTuple(tuple)` on `ProjectData`. `AxisVariance`'s grid drops its per-cell `permutations.find` scans for `O(1)` `Map.get` lookups. Bounded by the permutation count regardless of how many cells render.
