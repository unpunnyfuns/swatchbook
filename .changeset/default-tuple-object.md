---
'@unpunnyfuns/swatchbook-core': minor
---

`Config.default` now takes a partial tuple object (`{ axisName: contextName }`) instead of a composed permutation string. Partial tuples fill omitted axes from each axis's own `default`; unknown axis keys and invalid context values surface as `warn` diagnostics (group `swatchbook/default`) and are sanitized out. Omit `default` entirely to start in the all-axis-defaults tuple.

Migration: replace `default: 'Light · Default'` with `default: { mode: 'Light', brand: 'Default' }` (or omit the field if the all-defaults tuple is fine).
