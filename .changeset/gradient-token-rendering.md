---
'@unpunnyfuns/swatchbook-blocks': minor
---

Add `<GradientPalette filter? />` block for DTCG `gradient` tokens, and a `gradient` branch on `TokenDetail`'s composite preview. Samples default to `linear-gradient(to right, …)` since DTCG gradients are stop arrays and the gradient function is a rendering choice consumers make at use-site — if you need radial / conic previews, reach for a custom block.

This closes the last spec-level `$type` gap the reference fixture was missing; Terrazzo-extension types (`boolean`, `string`, `link`) remain intentionally out of scope per `docs/type-coverage.md`.
