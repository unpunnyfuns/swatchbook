---
'@unpunnyfuns/swatchbook-addon': patch
---

Add a page-level `role="status" aria-live="polite"` region to the addon's preview decorator so screen readers announce theme/axis-flip changes. When a user flips the toolbar or applies a preset, the region's text content becomes `Theme: <composed tuple name>` after a 250ms debounce — rapid axis flips collapse into one announcement instead of bursting through.

The element renders inside the existing `themedDecorator` wrapper (sibling of the per-story `<Story />` container) with the standard visually-hidden style so it's discoverable by SR but stays out of visual + pointer flow. Initial story mount stays silent (no spurious announcement on page load); only subsequent `themeName` changes fire.
