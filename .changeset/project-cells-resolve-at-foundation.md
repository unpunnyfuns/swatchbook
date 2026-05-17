---
"@unpunnyfuns/swatchbook-core": minor
"@unpunnyfuns/swatchbook-addon": minor
"@unpunnyfuns/swatchbook-blocks": minor
"@unpunnyfuns/swatchbook-switcher": minor
"@unpunnyfuns/swatchbook-mcp": minor
"@unpunnyfuns/swatchbook-integrations": minor
---

`@unpunnyfuns/swatchbook-core`: add `Project.cells`, `Project.jointOverrides`, `Project.defaultTuple`, and `Project.resolveAt(tuple)` alongside the existing cartesian shape. `cells[axisName][contextName]` holds the resolved `TokenMap` for `{ ...defaultTuple, [axisName]: contextName }` — bounded by `Σ(axes × contexts)` regardless of cartesian product size. `jointOverrides` carries the divergent partial-tuple values that cell composition cannot reconstruct on its own, populated by an exhaustive arity-ascending probe so `resolveAt(tuple)` is exactly equivalent to `permutationsResolved[permutationID(tuple)]` for every fixture tuple (covers joint variance at any order, not just pairs). Additive — no consumer migration required; foundation for the subsequent PRs that move blocks / MCP / virtual module off the cartesian map.
