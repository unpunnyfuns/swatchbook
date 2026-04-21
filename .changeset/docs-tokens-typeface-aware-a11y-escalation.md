---
'@unpunnyfuns/swatchbook-blocks': patch
---

docs(tokens): a11y=High-contrast escalates base font through each typeface's accessibility slot

Partial re-introduction of typography into a11y=High-contrast — but typeface-aware this time, so the axes stay conceptually separate in their overlay files while composing into different outcomes per tuple.

Shape:

- Every typeface context declares `font.family.base-accessible` alongside `font.family.base`. Mode-level Variable default: `base = system`, `base-accessible = comic`. Monotype overlay: `base = mono`, `base-accessible = comic-mono`.
- `high-contrast.json` aliases `font.family.base = {font.family.base-accessible}` — doesn't mention any typeface name; resolves through whichever typeface slot is active.
- `resolutionOrder` flipped to `[tokens, mode, typeface, a11y]` so a11y gets the last word after typeface has declared its accessibility slot.

Outcomes per tuple:

- typeface=Variable + a11y=Normal → system
- typeface=Variable + a11y=High-contrast → Comic Sans (variable-width comic signal)
- typeface=Monotype + a11y=Normal → monospace
- typeface=Monotype + a11y=High-contrast → Comic Mono (comic-monospace signal)

Same alias-indirection pattern as `color.accessible.primary.*` — just applied to font-family now.
