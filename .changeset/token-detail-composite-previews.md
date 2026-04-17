---
'@unpunnyfuns/swatchbook-blocks': minor
---

`TokenDetail` now renders live previews for composite token types in its Resolved-value section. Typography tokens get a pangram sample styled via the emitted sub-vars (font-family / font-size / font-weight / line-height / letter-spacing); shadow and border tokens get a sample card with the effect applied; transition tokens get an animated ball using the composite's duration + easing. Color tokens keep their swatch. The preview sits above the formatted value text — one read gives you "what it looks like" and "what its sub-values are" together.

Reduced-motion compliance: transition previews swap to an inline "Animation suppressed" notice when `prefers-reduced-motion: reduce` is set. `usePrefersReducedMotion` lifted to `internal/prefers-reduced-motion.ts` so it's shared with `MotionPreview`.
