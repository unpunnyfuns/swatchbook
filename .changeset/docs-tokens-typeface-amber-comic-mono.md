---
'@unpunnyfuns/swatchbook-blocks': patch
---

docs(tokens): rename `brand` axis to `typeface`, swap a11y primary to amber, route Monotype through a comic-monospace stack

Three coordinated edits on the docs-site fixture that bring the axes' names in line with what they actually do and sharpen the accessibility signal:

- **Axis rename.** `brand` was never a brand axis — it chose between a variable-width and a monospaced typeface. Renamed to `typeface` with contexts `Variable` / `Monotype`; the data-attribute selector becomes `[data-sb-typeface="…"]`. The storybook reference fixture's `brand` axis (an actual brand variation) is unchanged.
- **A11y primary → amber.** `color.accessible.primary.*` in both mode files now aliases to a new `color.palette.amber.*` ramp instead of `color.palette.brand.*`. a11y=High-contrast gets yellow/burnt-orange links that read as high-visibility accessibility signal rather than brand voice — burnt-orange (amber.800) on white for Light + High-contrast, bright yellow (amber.300) on dark for Dark + High-contrast, both well above AAA contrast.
- **Monotype = comic-monospace.** New `font.family.comic-mono` fontFamily stack that prefers playful free monospaces (Comic Mono, Fantasque Sans Mono, Comic Shanns Mono) then falls through to Comic Sans MS and the system monospace. The Monotype overlay uses this stack, so toggling typeface=Monotype now reads as slightly-unhinged teletype rather than plain code font.

No bundled font files — readers with Comic Mono / Fantasque Sans Mono installed locally get the playful face, everyone else gets Comic Sans MS or the system monospace fallback.
