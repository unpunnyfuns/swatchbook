---
'@unpunnyfuns/swatchbook-core': patch
'@unpunnyfuns/swatchbook-addon': patch
'@unpunnyfuns/swatchbook-blocks': patch
'@unpunnyfuns/swatchbook-switcher': patch
'@unpunnyfuns/swatchbook-integrations': patch
'@unpunnyfuns/swatchbook-mcp': patch
---

Documentation review follow-ups.

- Accuracy: drop the stale `Diagnostic.column` field, correct the `useSwatchbookData()` return shape and the `Project` field list (no `css`), remove the bogus `OpacityScale` filter default, fix the `useToken` import path (`/hooks` subpath), and point a guide at the public `useSwatchbookData()` instead of internal `useProject()`.
- READMEs: refresh `core`'s README for the current `tokenGraph` API (drop `jointOverrideKey`, the `resolve-at` subpath, and `cells`/`jointOverrides`/`varianceByPath`), and rewrite the `apps/docs` and `apps/storybook` scaffold READMEs into real, on-convention pages.
- Storybook dogfood: fix the Motion demo filter (`cubicBezier.**`) and add the missing `color.text` variants.
- Prose: remove em-dashes from all documentation prose (code samples untouched).

Patch so the release snapshot rebuilds with the corrected docs.
