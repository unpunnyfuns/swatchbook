---
"@unpunnyfuns/swatchbook-blocks": patch
---

`TokenNavigator` no longer resets its expand/collapse state when the active tuple changes. Previously, flipping a mode/brand/contrast in the toolbar gave `resolved` (and the derived tree) a fresh identity, which snapped the tree back to the `initiallyExpanded` default — collapsing whatever the user had opened. The expand/collapse state now persists across settings changes and is re-seeded only when the `initiallyExpanded` prop itself changes.
