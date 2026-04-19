---
'@unpunnyfuns/swatchbook-addon': patch
---

Fix the Swatchbook toolbar popover not closing on outside click. `WithTooltipPure`'s built-in `closeOnOutsideClick` misses the case of clicks that land outside the portaled popover; add a document-level `mousedown` listener while open that closes unless the click is inside the trigger wrapper or the popover body.
