---
'@unpunnyfuns/swatchbook-blocks': patch
---

docs(tokens): give the docs-site's high-contrast axis real contrast boost

The a11y axis on the docs-site tokens used to only swap the base font to a comic display face and bump font size by 8%. Colors stayed identical — which undersold the accessibility signal and didn't meaningfully improve the site's contrast on either Light or Dark.

Adds mode-aware contrast-boosted values via alias indirection: each mode file (`themes/light.json`, `themes/dark.json`) now carries a parallel `color.accessible.*` namespace with darker-on-light / brighter-on-dark variants of `text.muted` and the full primary ramp. `themes/high-contrast.json` aliases role tokens to that namespace, so the a11y overlay stays mode-agnostic at the file level while the resolved values remain mode-aware.

Visible outcomes on a11y=High-contrast:

- Light: `primary.default` from `brand.600` (contrast ~4.8:1 on white) to `brand.800` (~9.5:1); `text.muted` from `neutral.500` (~4.5:1) to `neutral.700` (~10:1).
- Dark: `primary.default` from `brand.500` to `brand.300`; `text.muted` from `neutral.300` to `neutral.100`.

No change to Normal-contrast Light or Dark — this is purely the a11y overlay gaining colour where before it only carried typography.
