---
"@unpunnyfuns/swatchbook-core": patch
"@unpunnyfuns/swatchbook-blocks": patch
"@unpunnyfuns/swatchbook-addon": patch
---

Partial close of #835. Eliminates 11 of 13 `as string` / `as number` casts that worked around `noUncheckedIndexedAccess`. Each was replaced with a proper narrowing pattern (`typeof` checks, hoisted-variable + undefined-check, or `for…of` over `.entries()`):

- `packages/core/src/types.ts` — `permutationID` uses destructured `[first, ...rest]` to narrow the array.
- `packages/core/src/joint-overrides.ts` — `partialTuple[axis.name]` reads narrow via `undefined`-check `continue`.
- `packages/core/src/variance-analysis.ts` — single-touching-axis case narrows by checking `axis !== undefined`.
- `packages/core/src/fuzzy.ts` — ranked-index walk uses `flatMap` to drop undefined entries.
- `packages/blocks/src/TokenNavigator.tsx` — segments loop narrows + continues on undefined.
- `packages/blocks/src/format-color.ts` — `hexVal` hoisted then `typeof` narrowed.
- `packages/blocks/src/internal/sort-tokens.ts` — `safeNumber` helper narrows `number | null | undefined` from `colorjs.io`'s `coords`.
- `packages/addon/src/manager.tsx` — `rawTuple` / `rawColorFormat` narrow via `typeof` + literal-equality check.

Two casts remain, both intentional: `sort-tokens.ts:187` (`source as string` for `colorjs.io`'s constructor union — documented in the surrounding comment) and `preview.tsx:294` (`previewResolveAt as unknown as ...` — structural mismatch the audit specifically flagged for a separate fix; tracked in #835 follow-up).
