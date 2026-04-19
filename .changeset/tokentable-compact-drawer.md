---
'@unpunnyfuns/swatchbook-blocks': minor
'@unpunnyfuns/swatchbook-addon': minor
'@unpunnyfuns/swatchbook-core': minor
---

**Breaking**: `<TokenTable />` redesign — compact two-column layout (`Path | Value`) with a click-to-open `<TokenDetail>` slide-over. The row's value cell renders the type pill + color swatch + formatted value inline. The `showVar` prop is removed; the CSS var is one click away in the drawer. Table layout is now `auto` (no fixed percentage widths) with per-column `min-width` floors so columns follow content and stop collapsing on narrow containers. Consumers who want to own the follow-up UI can pass `onSelect(path)` to suppress the built-in drawer. The `<TokenNavigator />` drawer is unchanged in behavior but now shares the same overlay component internally (no visible difference).
