---
"@unpunnyfuns/swatchbook-core": minor
"@unpunnyfuns/swatchbook-addon": minor
"@unpunnyfuns/swatchbook-blocks": minor
"@unpunnyfuns/swatchbook-switcher": minor
"@unpunnyfuns/swatchbook-mcp": minor
"@unpunnyfuns/swatchbook-integrations": minor
---

`@unpunnyfuns/swatchbook-addon`: add `emitMode: 'cartesian' | 'projected'` option, defaulting to `'projected'`. The smart axis-projected emitter (`emitAxisProjectedCss`) now backs the addon's virtual-module `css` export — one `:root` baseline + per-cell deltas + compound `[data-A][data-B]` blocks for joint-variant tokens. Output is dramatically smaller than cartesian for typical fixtures while remaining spec-faithful for non-orthogonal DTCG resolvers. Pass `emitMode: 'cartesian'` to fall back to the explicit per-tuple fan-out (`projectCss`) — keep this in mind only for pathological cardinality where the projection analysis pass is too costly.
