---
"@unpunnyfuns/swatchbook-blocks": patch
---

Render every non-color token through plugin-css's `previewValue` from the Token Listing — the CSS string the consumer's production stylesheet emits. A `cleanFloatNoise` post-processor scrubs IEEE-754 representation artefacts (e.g. `55.00000000000001%` → `55%`) by rounding any decimal with 8+ fractional digits to 1/1000; authored 3-decimal precision passes through unchanged. The local fallback formatters for `gradient`, `typography`, and `transition` are dropped — projects without a listing entry see truncated JSON for those types.
