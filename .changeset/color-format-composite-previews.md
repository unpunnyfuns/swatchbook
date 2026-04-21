---
'@unpunnyfuns/swatchbook-blocks': patch
---

fix(blocks): honor the color-format selector in Shadow/Border/Gradient previews

`<ShadowPreview>`, `<BorderPreview>`, and `<GradientPalette>` each shipped
a local `formatColor` helper that ignored the toolbar's color-format
selector — their sub-value text stayed in `colorSpace(components…)` or
`rgb(%)` regardless of what the user picked. Now they route through the
shared `formatColor` from `@unpunnyfuns/swatchbook-blocks`, subscribing
to `useColorFormat()` the same way `<ColorPalette>` and
`<CompositeBreakdown>` do.

Flipping the toolbar between hex / rgb / hsl / oklch / raw now updates
the breakdown labels in all three blocks.
