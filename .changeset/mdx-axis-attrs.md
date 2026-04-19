---
'@unpunnyfuns/swatchbook-addon': patch
'@unpunnyfuns/swatchbook-blocks': patch
---

Fix axis switching on MDX docs pages. The addon's preview decorator wrote `data-<axis>` attributes to `<html>` from inside the story wrapper — so bare MDX pages (no `<Story />`) had no ancestor carrying the tuple, the per-tuple CSS selectors never matched, and colors stayed on `:root` defaults no matter what the toolbar did. Subscribe to the channel at module level and write the same attrs independent of any decorator run, and pick up `setGlobals` in the blocks' fallback so the "Active tuple" indicator reflects the current selection on first render.
