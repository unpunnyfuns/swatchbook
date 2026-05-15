---
'@unpunnyfuns/swatchbook-addon': patch
---

Ship root-level `manager.js`, `preset.js`, `preview.js` shims alongside the existing `package.json#exports` subpath entries. Tools that resolve addon entrypoints by joining filenames onto the package directory — bypassing `exports` — now find the entry files without ceremony. Storybook 10.x, which resolves via `exports`, is unaffected.
