---
'@unpunnyfuns/swatchbook-blocks': patch
'@unpunnyfuns/swatchbook-addon': patch
---

Narrow `useMemo` dep arrays in `TokenTable`, `ColorPalette`, `ColorTable`, and the addon preview decorator to the specific fields each memo body actually consumes. Previously they depended on the whole `project` / `globals` / `parameters` object — token-value HMR or Storybook's per-render object recreation invalidated downstream memos even when the consumed fields were unchanged.

- `resolveCssVar` and `resolveColorValue` in `packages/blocks/src/internal/use-project.ts` now take `Pick<ProjectData, 'listing' | 'cssVarPrefix'>` and `Pick<ProjectData, 'listing'>` respectively. Existing callers passing the full `ProjectData` keep working via structural subtyping.
- `resolveTuple` and `resolveColorFormat` in `packages/addon/src/preview.tsx` take their inputs directly (`axesGlobal` + `paramSwatchbook` / `colorFormatGlobal`) instead of the broader `SwatchbookGlobals` + `StoryParameters` bags.
