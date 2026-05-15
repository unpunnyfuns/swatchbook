---
'@unpunnyfuns/swatchbook-blocks': patch
---

Replace the `Record<string, unknown>` casts used to read DTCG composite `$value` shapes (`typography`, `border`, `transition`, `shadow`, `gradient`, `color`, `strokeStyle`) with named per-`$type` interfaces in a new `internal/composite-types.ts`. Sub-values stay `unknown` because each may be a primitive, an alias-resolved string, or a nested composite — the win is that typos in key reads (`fontFamlly`, `offstX`) now surface as compile errors instead of silent `undefined`s. 13 scattered casts collapse into 4 named imports. Internal refactor only; no behaviour change.
