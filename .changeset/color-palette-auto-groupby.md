---
'@unpunnyfuns/swatchbook-blocks': minor
---

`ColorPalette`'s `groupBy` prop is now optional. When omitted, grouping is derived from the filter: one level below the filter's fixed prefix, clamped so every swatch keeps a leaf label. `<ColorPalette filter='color.sys.*' />` groups at `color.sys.<family>` automatically; `<ColorPalette filter='color.ref.blue.*' />` collapses the whole ramp into one group with each shade as a leaf. Pass `groupBy` explicitly when you want something the heuristic wouldn't pick.
