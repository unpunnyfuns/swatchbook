---
"@unpunnyfuns/swatchbook-blocks": patch
"@unpunnyfuns/swatchbook-switcher": patch
---

Add `./style.css` to each package's `exports` map. The CSS files were already shipped via internal side-effect imports, but consumers that wanted to deliberately link the stylesheet (extract, reorder cascade, ship as a separate `<link>`) couldn't reach it via the package map. Now `import '@unpunnyfuns/swatchbook-blocks/style.css'` and `import '@unpunnyfuns/swatchbook-switcher/style.css'` resolve explicitly. The existing side-effect import path is unchanged.
