---
'@unpunnyfuns/swatchbook-core': patch
'@unpunnyfuns/swatchbook-addon': patch
'@unpunnyfuns/swatchbook-blocks': patch
'@unpunnyfuns/swatchbook-switcher': patch
'@unpunnyfuns/swatchbook-integrations': patch
'@unpunnyfuns/swatchbook-mcp': patch
---

Substitute DTCG `$ref` objects in modifier values against the resolver's baseline output. The resolver-based loader's `extractWritesFromModifiers` was reading from `resolver.source.modifiers` directly — a pre-`processTokens` representation where cross-document `$ref` references in modifier source values (e.g. a semantic token's `components` referencing a primitive's `components` array via JSON Pointer) had not yet been resolved. The unresolved `{ $ref }` objects flowed through write values into the walker and reached emit time, where colorjs.io crashed on them. The fix performs the same JSON Pointer substitution at write-extraction time, using the already-resolved baseline as the lookup source. Unresolved pointers are left intact and continue to surface via the existing emit-time error wrap and load-time diagnostic.
