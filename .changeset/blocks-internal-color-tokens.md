---
"@unpunnyfuns/swatchbook-blocks": patch
---

Move the blocks' hardcoded diagnostics + deprecated colors into internal tokens that adapt to the surface (status colors mix their hue with the adaptive chrome text; deprecated badge text uses `text-muted`), fixing WCAG failures on dark-mode surfaces with no `light-dark()`/OS coupling
