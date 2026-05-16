---
"@unpunnyfuns/swatchbook-core": minor
"@unpunnyfuns/swatchbook-addon": minor
"@unpunnyfuns/swatchbook-blocks": minor
"@unpunnyfuns/swatchbook-switcher": minor
"@unpunnyfuns/swatchbook-mcp": minor
"@unpunnyfuns/swatchbook-integrations": minor
---

`@unpunnyfuns/swatchbook-core`: rewrite `emitAxisProjectedCss` to route per-token between projection (single-attribute selectors) and compound selectors based on `analyzeProjectVariance`. Spec-faithful for any DTCG-compliant resolver — orthogonal projects still get the size win; joint-variant projects get compound `[data-A][data-B]` blocks that preserve the cartesian-correct value at exactly the divergent joint tuples. Smart dedup: cells re-emit a token's value when ANY axis touches it (not just when this cell differs from baseline), so cascade-order resolves orthogonal-after-probe tokens correctly. Signature changed to `(project, options)` — function is `@internal`, only consumed in-package; no public API broken.
