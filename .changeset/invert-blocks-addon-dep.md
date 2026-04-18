---
'@unpunnyfuns/swatchbook-blocks': minor
'@unpunnyfuns/swatchbook-addon': minor
---

Move `SwatchbookProvider`, `SwatchbookContext`, `ThemeContext`, `AxesContext`, `useSwatchbookData`, `useOptionalSwatchbookData`, `useActiveTheme`, and `useActiveAxes` from `@unpunnyfuns/swatchbook-addon` into `@unpunnyfuns/swatchbook-blocks` so the workspace dep graph runs addon → blocks (the direction it was always meant to). The addon re-exports the same names for back-compat with existing `@unpunnyfuns/swatchbook-addon` and `@unpunnyfuns/swatchbook-addon/hooks` imports; new code should import directly from `@unpunnyfuns/swatchbook-blocks`. Closes issue #202.
