---
'@unpunnyfuns/swatchbook-addon': patch
---

Kill the stray focus ring that stuck on previously-clicked toolbar pills. `outline: none` alone wasn't enough — Storybook's button theme paints a `box-shadow`-based focus ring on `:focus`, which inline style overrides. Added `boxShadow: 'none'` to the pill base.
