---
'@unpunnyfuns/swatchbook-blocks': patch
---

`DetailOverlay` now implements the WAI-ARIA dialog pattern's focus management. Opening the overlay moves focus into the panel; Tab is trapped so it cycles through the panel's interactive descendants only; closing restores focus to whatever opened the overlay (typically the table row or tree item the user clicked). Previously focus could wander into the backgrounded page on Tab, and after dismissal the user landed at the top of the document.
