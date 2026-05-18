---
'@unpunnyfuns/swatchbook-blocks': patch
---

`<DetailOverlay>` now sets `inert` on every other top-level body branch while it's mounted, restoring each sibling's original state on unmount. `aria-modal="true"` alone is widely known to be insufficient — VoiceOver and NVDA virtual cursors + swipe gestures still pierce the dialog and read sibling content behind the backdrop. `inert` is the modern fix; browsers without it (very old Safari/Firefox/Chrome) fall back to the existing focus trap + `aria-modal`.

Bundled focus + inert in one `useEffect` so cleanup runs un-inert *before* opener-focus restore — `.focus()` on an inert element is a no-op, so the order matters.
