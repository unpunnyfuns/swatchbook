---
'@unpunnyfuns/swatchbook-blocks': patch
---

Sort token paths numerically so `color.ref.blue.50` comes before `color.ref.blue.100` instead of after. All block sorts now use `localeCompare(..., { numeric: true })`. Also corrected the `ColorPalette` `RefBlue` story's `groupBy` from `4` to `3` so every ramp shade groups under `color.ref.blue` instead of one swatch per row.
