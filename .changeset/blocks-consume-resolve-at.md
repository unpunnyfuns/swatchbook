---
"@unpunnyfuns/swatchbook-core": minor
"@unpunnyfuns/swatchbook-addon": minor
"@unpunnyfuns/swatchbook-blocks": minor
"@unpunnyfuns/swatchbook-switcher": minor
"@unpunnyfuns/swatchbook-mcp": minor
"@unpunnyfuns/swatchbook-integrations": minor
---

`@unpunnyfuns/swatchbook-core`: expose `buildResolveAt` via the new `./resolve-at` subpath — a small, dep-free entry point browser-side consumers can import without dragging the loader / Terrazzo runtime through their bundles.

`@unpunnyfuns/swatchbook-blocks`: blocks now consume `resolveAt(activeTuple)` instead of indexing `permutationsResolved[activePermutation]` for the current `resolved` token map. `ProjectData` exposes `resolveAt` so per-tuple consumers (the `AxisVariance` block's grid cells) can read any tuple's values without `permutations.find` + tuple-name scans. Snapshots that pre-date the cells wire format fall back to `permutationsResolved` indexing — covers hand-built test snapshots and the docs-site path.
