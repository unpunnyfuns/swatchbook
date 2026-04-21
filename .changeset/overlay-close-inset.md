---
'@unpunnyfuns/swatchbook-blocks': patch
---

fix(blocks): align detail-overlay close button with panel padding

The slide-over close button was pinned at `top: 8px; right: 8px` — half
the 16px panel padding — so it sat tucked against the corner instead of
aligning with the content. Bumped both to `16px` so the button sits
inside the visual inset, flush with the heading.
