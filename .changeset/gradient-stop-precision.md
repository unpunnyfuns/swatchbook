---
"@unpunnyfuns/swatchbook-blocks": patch
---

Fix: composite tokens (`gradient`, `typography`, `transition`) once again render through plugin-css's `previewValue` — the CSS string the consumer's production stylesheet would emit. Inspector rendering stays in lockstep with what's shipped. Adds a `cleanFloatNoise` post-processor that normalises IEEE-754 representation artefacts (e.g. `55.00000000000001%` for a 0.55 gradient stop) by rounding any decimal with eight or more fractional digits to 1/1000. Authored 3-decimal precision (`33.333%`, `0.875rem`) passes through unchanged. The local `formatGradient` / `formatTypography` / `formatTransition` formatters remain as the no-listing-entry fallback.
