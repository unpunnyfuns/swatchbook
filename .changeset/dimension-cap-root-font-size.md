---
"@unpunnyfuns/swatchbook-blocks": patch
---

Fix dimension previews to scale `rem` by the rendering context's actual root font-size (tracked across responsive breakpoints) instead of a hardcoded 16px, for both the DimensionScale render cap and the `sortBy: 'value'` order; drop the non-DTCG `em` unit
