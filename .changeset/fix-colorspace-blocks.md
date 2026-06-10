---
'@unpunnyfuns/swatchbook-core': patch
'@unpunnyfuns/swatchbook-blocks': patch
---

fix blocks sortTokens and GradientPalette ignoring colorSpace on wide-gamut tokens; both now route through the shared colorjs construction (new core parseColor) so perceptual sort and gradient swatches respect display-p3 / a98-rgb / prophoto-rgb
