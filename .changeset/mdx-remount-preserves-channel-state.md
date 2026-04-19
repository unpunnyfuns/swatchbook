---
'@unpunnyfuns/swatchbook-blocks': patch
---

Fix MDX-rendered blocks flickering back to default values one frame after an axis or color-format change. Storybook force-rerenders the docs container on every `updateGlobals`, which remounts the MDX-embedded blocks and reset their local `useState` trackers. Lift the channel-derived globals (axes / theme / color format) to a module-level store consumed via `useSyncExternalStore` so the values survive remounts, and drop the `setGlobals` listener that could overwrite a just-toggled value with the pre-toggle snapshot in edge orderings.
