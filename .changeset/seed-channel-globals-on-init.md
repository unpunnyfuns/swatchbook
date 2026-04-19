---
'@unpunnyfuns/swatchbook-blocks': patch
---

Fix MDX blocks rendering defaults for one frame when the toolbar's URL-persisted selection is non-default. Storybook stores toolbar state in `?globals=…`, so deeplinking or reloading with e.g. `swatchbookColorFormat:rgb` already has `rgb` in the preview's `userGlobals`, but `SET_GLOBALS` — the event that carries it on init — fired before our listener subscribed. Subscribe at module load and re-add the `setGlobals` handler so first render matches the persisted selection.
