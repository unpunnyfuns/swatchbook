---
'@unpunnyfuns/swatchbook-blocks': patch
---

Fix the toolbar's color-format switcher (hex / rgb / hsl / oklch / raw) having no effect on blocks rendered in MDX docs pages. `useColorFormat()` was context-only, and the addon's preview decorator — which populates the context — doesn't run on bare MDX pages. Subscribe to `globalsUpdated` / `updateGlobals` / `setGlobals` as a fallback when no provider is mounted, mirroring `useProject()`'s existing pattern.
