---
'@unpunnyfuns/swatchbook-core': minor
'@unpunnyfuns/swatchbook-blocks': patch
---

Brand the public `TokenMap` shape as `SwatchbookToken` — a strict subset of `@terrazzo/parser`'s `TokenNormalized` covering only the seven fields downstream consumers actually read (`$type`, `$value`, `$description`, `aliasOf`, `aliasChain`, `aliasedBy`, `partialAliasOf`). `Project.defaultTokens` and `Project.resolveAt()` now return `Record<string, SwatchbookToken>` instead of leaking the full `TokenNormalized` shape (with `id`, `source`, `originalValue`, `group`, `dependencies`, `$extensions`, `$extends`, `$deprecated`) onto the public surface.

Insulates swatchbook consumers from future Terrazzo type churn: a rename or restructure inside `TokenNormalized` won't ripple through the swatchbook API. Pre-1.0 coordinated break worth doing before 1.0 commits us.

`SwatchbookToken` is structurally compatible with `TokenNormalized` — internal core code that bridges resolver output into a `TokenMap` keeps working without changes. The smart emitter (`css-axis-projected.ts`) is the one site that genuinely needs the full Terrazzo shape to drive `transformCSSValue` / `generateShorthand`; it casts at the boundary via a documented `asRawTokens` helper.

Closes #892
