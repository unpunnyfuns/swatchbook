---
"@unpunnyfuns/swatchbook-core": minor
"@unpunnyfuns/swatchbook-blocks": patch
"@unpunnyfuns/swatchbook-addon": patch
---

Closes #824. Third and final half — consolidates the three `dataAttr` impls onto a single `@unpunnyfuns/swatchbook-core/data-attr` subpath, matching the shape of `/css-var`, `/resolve-at`, and `/fuzzy`.

Previously `dataAttr` lived in three places with identical bodies:
- `packages/core/src/css-axis-projected.ts:8` — private inline
- `packages/addon/src/data-attr.ts` — standalone file, used by `preview.tsx` (5 call sites)
- `packages/blocks/src/internal/data-attr.ts` — alongside `themeAttrs` / `BLOCK_ATTR` / `WRAPPER_CLASSES`, used by `themeAttrs` internally and `AxisVariance.tsx` directly

The duplication existed because addon and blocks couldn't import from core's main barrel (Node-only loader deps), so each made a local copy. The browser-safe subpath pattern (established by `/resolve-at` and `/fuzzy`) eliminates the dilemma.

Touched files:
- new `packages/core/src/data-attr.ts` + `./data-attr` export in `package.json`
- `packages/core/src/css-axis-projected.ts` — drops inline, imports from `#/data-attr.ts`
- `packages/addon/src/data-attr.ts` deleted; `preview.tsx` imports from the core subpath
- `packages/blocks/src/internal/data-attr.ts` — drops local `dataAttr`, imports from core; keeps `themeAttrs` / `BLOCK_ATTR` / `WRAPPER_CLASSES`
- `packages/blocks/src/token-detail/AxisVariance.tsx` — direct subpath import (was reaching through blocks' internal file)
- `data-attr.test.ts` moves from addon's test dir to core's (test follows the impl)

Closes the audit's #824 consolidation cluster: `canonicalKey` / `valueKey` / `cssEscape` (PR #869), `findPermByTuple` (eliminated by cartesian drop), `makeCssVar` (PR #880), and `dataAttr` (this PR). The `defaultTuple` builder remains explicitly skipped — 2-line inlines per the original audit comment, extracting it adds an import for no real win.

Minor bump on core (new public subpath); patch on blocks + addon.
