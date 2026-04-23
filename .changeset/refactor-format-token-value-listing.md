---
'@unpunnyfuns/swatchbook-blocks': patch
---

Thread the Token Listing entry through `formatTokenValue` so composite display strings (shadow / border / gradient / typography / transition) prefer `listing[path].previewValue` when available. Before this PR, value stringification for composite types was still stitched locally — listing's authoritative plugin-css-computed string was ignored. The gate: non-color types always prefer listing; color tokens prefer listing only when the active color format is `'hex'` (other formats stay as colorjs.io inspection output). Closes the last drift surface from the Token Listing adoption.

Callers updated: `TokenTable`, `TokenDetail`, `TokenNavigator`, `DimensionScale`, `StrokeStyleSample`. `AxisVariance` deliberately keeps local formatting because it renders per-theme resolved values and listing entries carry one canonical representation.
