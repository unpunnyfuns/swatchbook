---
'@unpunnyfuns/swatchbook-blocks': patch
---

docs(tokens): match the switcher's axis order to the resolution order

`resolutionOrder` controls which overlay wins when two touch the same token; the `modifiers` object's key order controls how the switcher UI enumerates the axes. The previous PR swapped resolutionOrder to `mode → typeface → a11y` but left modifiers in the old `mode → a11y → typeface` shape, so the switcher still rendered a11y before typeface.

Swapping modifiers to match. Switcher now shows **mode → typeface → a11y**, which matches the conceptual flow: pick your base font, then opt in to the accessibility overlay on top.
