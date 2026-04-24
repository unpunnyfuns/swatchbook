---
'@unpunnyfuns/swatchbook-blocks': minor
---

Add `<OpacityScale>` — a type-specific block that renders each opacity token as the sample colour at that opacity over a checkerboard backdrop, so the transparency reads visually. Only `$type: 'number'` (or `'opacity'`) tokens whose `$value` is a finite number in `[0, 1]` are picked up; non-opacity `number` siblings (`line-height`, `z-index`) fall out naturally. Accepts `filter`, `type`, `sampleColor`, `sortBy`, `sortDir`, `caption` props. Default filter `'**.opacity.*'` covers common layouts (`number.opacity.*`, `opacity.*`) without configuration; default `sampleColor` is `'color.accent.bg'`.
