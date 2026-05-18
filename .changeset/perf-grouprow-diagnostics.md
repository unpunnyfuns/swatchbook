---
'@unpunnyfuns/swatchbook-blocks': patch
---

Two small perf fixes in blocks:

- `GroupRow` in `<ColorTable>` is now wrapped in `React.memo`. Every variant-pill click or row-expand mutates `selectedByBase` / `expandedByBase` at the parent, but with no memo every row re-rendered on each mutation. With `memo` only the affected row re-renders; the parent's existing `useCallback`-wrapped handlers carry stable identity.
- `<Diagnostics>` collapsed the three separate traversals over `diagnostics` (`summaryText` for counts, `hasErrorsOrWarnings` for the open-flag, `summaryVariant` for the className) into one `summarize()` walk that returns `{ text, variant, hasErrorsOrWarnings }`. Wrapped in `useMemo` keyed on `diagnostics` so the walk only runs when the array identity changes.
