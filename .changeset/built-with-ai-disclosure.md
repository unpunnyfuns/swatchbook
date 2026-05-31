---
'@unpunnyfuns/swatchbook-core': patch
'@unpunnyfuns/swatchbook-addon': patch
'@unpunnyfuns/swatchbook-blocks': patch
'@unpunnyfuns/swatchbook-switcher': patch
'@unpunnyfuns/swatchbook-integrations': patch
'@unpunnyfuns/swatchbook-mcp': patch
---

Add a "Built with AI" disclosure to the docs. A short block on the Introduction page states plainly that nearly all of swatchbook's code is written by an AI coding agent under human direction, and a new `developers/built-with-ai.mdx` page lays out who does what, what a human gates (every merge, every release), the quality machinery, and where the effort goes. Patch so the next release's snapshot rebuild picks it up.
