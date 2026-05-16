---
"@unpunnyfuns/swatchbook-core": minor
"@unpunnyfuns/swatchbook-addon": minor
"@unpunnyfuns/swatchbook-blocks": minor
"@unpunnyfuns/swatchbook-switcher": minor
"@unpunnyfuns/swatchbook-mcp": minor
"@unpunnyfuns/swatchbook-integrations": minor
---

`@unpunnyfuns/swatchbook-core`: add `emitAxisProjectedCss(permutations, permutationsResolved, options?)` as an opt-in alternative to `emitCss` / `projectCss`. Emits one `:root` baseline block plus one `[data-<prefix>-<axis>="<context>"] { … }` block per non-default axis cell, carrying only the declarations that differ from baseline at that cell. Output composes via CSS cascade at runtime instead of fanning out across the cartesian tuple space. Axes must be orthogonal — see the function's doc-comment for the joint-variance limitation. Purely additive: existing `emitCss` / `projectCss` behavior unchanged.
