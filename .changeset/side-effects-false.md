---
'@unpunnyfuns/swatchbook-core': patch
'@unpunnyfuns/swatchbook-addon': patch
'@unpunnyfuns/swatchbook-blocks': patch
---

Declare `"sideEffects": false` on all three published packages. No CSS imports, no module-level work that isn't gated behind used-export reachability. Gives consumer bundlers permission to tree-shake unused exports more aggressively.
