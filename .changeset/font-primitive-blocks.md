---
'@unpunnyfuns/swatchbook-blocks': minor
---

Two new blocks surface standalone font primitives that were previously visible only inside `typography` composites:

- `FontFamilySample` renders one row per `fontFamily` token with sample text in that family, plus the full font stack as metadata.
- `FontWeightScale` renders one row per `fontWeight` token with sample text at that weight, sorted ascending by numeric weight so the scale is visually legible.

`TokenDetail`'s `CompositePreview` gains matching branches so opening a `font.ref.family.sans` or `font.ref.weight.bold` token in isolation *looks like* the font / weight rather than falling back to a JSON blob or bare integer.
