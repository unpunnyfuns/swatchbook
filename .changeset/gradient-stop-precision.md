---
"@unpunnyfuns/swatchbook-blocks": patch
---

Fix: gradient tokens now render their stop positions through the local `formatGradient` (which `Math.round`s) instead of plugin-css's `previewValue`. The latter computes `position * 100` without rounding, so a stop at `0.55` leaked through as `55.00000000000001%` in `<TokenNavigator>` / `<TokenTable>` / `<TokenDetail>` value rows. Restores the documented `→`-joined compact form for gradient values, leaving every other type's previewValue path unchanged.
