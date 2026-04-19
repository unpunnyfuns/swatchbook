---
'@unpunnyfuns/swatchbook-blocks': patch
---

Move `format-color.ts` out of `src/internal/` to `src/format-color.ts`. It's part of the public API (documented on the docs site, paired with `useColorFormat()`), so living in `internal/` was confusing to anyone reading the source. No consumer-visible API change — the `formatColor` / `COLOR_FORMATS` / `ColorFormat` / `FormatColorResult` / `NormalizedColor` exports from `@unpunnyfuns/swatchbook-blocks` are unchanged.
