---
"@unpunnyfuns/swatchbook-blocks": patch
---

`TokenNavigator` now restores keyboard focus to the first visible row when the focused token disappears from the tree (e.g. a toolbar axis flip drops a theme-specific token, or a live token edit removes the focused row). Previously the browser orphaned focus onto `<body>`, breaking the roving-tabindex invariant until the user tabbed back in.
