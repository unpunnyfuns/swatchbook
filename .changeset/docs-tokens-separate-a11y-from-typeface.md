---
'@unpunnyfuns/swatchbook-blocks': patch
---

docs(tokens): separate a11y from typeface in the docs-site fixture

`high-contrast.json` used to also swap the base font family to `{font.family.comic}` — a leftover from when a11y carried a typography signal on top of its contrast role. Now that the `typeface` axis owns font-family independently (Variable vs Monotype), having a11y also touch it meant `typeface=Variable + a11y=High-contrast` reshuffled the font regardless of the reader's typeface pick.

Drops the `font.family` block from the a11y overlay. a11y now owns **contrast only** — amber primary ramp via alias indirection, neutral shifts for muted text, plus the 108% base-size bump kept as a readability signal. Font family is entirely the typeface axis's domain: Variable ⇒ system, Monotype ⇒ comic-mono, regardless of a11y.
