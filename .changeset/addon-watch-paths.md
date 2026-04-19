---
'@unpunnyfuns/swatchbook-addon': patch
'@unpunnyfuns/swatchbook-core': patch
'@unpunnyfuns/swatchbook-blocks': patch
---

Tighten the addon's HMR watch-path matching. File-path matches now require a path-separator boundary (`/project/resolver.json` no longer also matches `/project/resolver.json.backup`), and `picomatch.scan` replaces the hand-rolled glob-to-dir regex — brace-expansion patterns (`tokens/{base,overlays}/**/*.json`) and nested globstars now derive the correct watch root.
