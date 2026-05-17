---
"@unpunnyfuns/swatchbook-core": patch
"@unpunnyfuns/swatchbook-addon": patch
"@unpunnyfuns/swatchbook-blocks": patch
"@unpunnyfuns/swatchbook-switcher": patch
"@unpunnyfuns/swatchbook-mcp": patch
"@unpunnyfuns/swatchbook-integrations": patch
---

`@unpunnyfuns/swatchbook-core`: smart emitter (`emitAxisProjectedCss`) and `analyzeProjectVariance` switch their Phase 1 cell construction from `findPermByTuple(permutations, …) → permutationsResolved[name]` to reading `project.cells` directly. Internal refactor only — same output for every fixture, just sourced from the bounded per-axis surface instead of the cartesian map. Phase 3 (joint case probing + lookup) still uses the resolver + `permutationsResolved`; that moves in the next PR alongside the loadProject rewrite. No public API changes.
