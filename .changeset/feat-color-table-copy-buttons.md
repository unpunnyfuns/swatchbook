---
'@unpunnyfuns/swatchbook-blocks': minor
---

New `<ColorTable />` block — one row per color token with HEX, HSL, OKLCH, CSS var, and alias-target columns side-by-side. Each value cell carries a copy-to-clipboard button that reveals on row hover / focus. Same `filter` / `sortBy` / `sortDir` / `searchable` / `onSelect` props as `<TokenTable />`, so it drops in wherever the existing table was scoped to colors.

`<TokenTable />` and `<TokenDetail />` also pick up copy-to-clipboard affordances: a button on the value cell in `TokenTable`, buttons on the resolved value and the usage snippet in `TokenDetail`.

Shared `CopyButton` primitive lives in the blocks package internals — silently no-ops on environments without `navigator.clipboard.writeText` (older Safari, insecure origins).
