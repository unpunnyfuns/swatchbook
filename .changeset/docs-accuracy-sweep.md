---
'@unpunnyfuns/swatchbook-core': patch
'@unpunnyfuns/swatchbook-addon': patch
'@unpunnyfuns/swatchbook-blocks': patch
'@unpunnyfuns/swatchbook-switcher': patch
'@unpunnyfuns/swatchbook-integrations': patch
'@unpunnyfuns/swatchbook-mcp': patch
---

Documentation accuracy sweep across the docs site and READMEs.

- Correct the Storybook peer floor (`10.3+` → `10.1+`) in quickstart, the addon reference, and the addon README; complete the addon peer list.
- Add the missing `defineMain` / `definePreview` imports to copy-pasteable Storybook config snippets.
- Fix the walker API description (`resolveAllAt` / `getVariance` are `core/graph` helpers, not `Project` methods), the diagnostics group names (namespaced `swatchbook/<area>`), and add the `/color-formats` + `/format-color` subpaths to the core reference.

Patch so the release snapshot rebuilds with the corrected docs.
