---
'@unpunnyfuns/swatchbook-core': patch
'@unpunnyfuns/swatchbook-addon': patch
'@unpunnyfuns/swatchbook-blocks': patch
'@unpunnyfuns/swatchbook-switcher': patch
'@unpunnyfuns/swatchbook-integrations': patch
'@unpunnyfuns/swatchbook-mcp': patch
---

Patch release to ship the docs audit fixes from PR #1002 into the stable docs snapshot. The fixes (corrected import paths, removed broken anchors, jargon swapped for plain language, prose register tightened) only reached `/next/` after the original PR — this release rebuilds the `version-0.60/` snapshot so they reach `/` too. No package source changes.
