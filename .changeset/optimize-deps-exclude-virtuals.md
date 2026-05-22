---
'@unpunnyfuns/swatchbook-core': patch
'@unpunnyfuns/swatchbook-addon': patch
'@unpunnyfuns/swatchbook-blocks': patch
'@unpunnyfuns/swatchbook-switcher': patch
'@unpunnyfuns/swatchbook-integrations': patch
'@unpunnyfuns/swatchbook-mcp': patch
---

The addon's Vite plugin now excludes its virtual module IDs (`virtual:swatchbook/tokens`, `virtual:swatchbook/integration-side-effects`) from Vite's `optimizeDeps` pre-bundling. Vite uses esbuild for pre-bundling, and esbuild doesn't see Rollup-style `resolveId` hooks — a preview file that gets pulled into pre-bundling and imports one of our virtuals would fail with `Could not resolve "virtual:swatchbook/tokens"`. The exclusion routes the virtuals through the dev-time plugin pipeline where `resolveId` / `load` handle them. Build mode is unaffected (Rollup throughout).
