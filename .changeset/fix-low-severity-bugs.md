---
'@unpunnyfuns/swatchbook-core': patch
'@unpunnyfuns/swatchbook-integrations': patch
'@unpunnyfuns/swatchbook-mcp': patch
---

fix four low-severity correctness bugs: core hex fallback dropping the alpha byte of #rrggbbaa/#rgba, css-in-js buildTree misfiling a path that collides with a leaf, tailwind mis-bucketing camelCase font-size tokens into spacing, and MCP describe_project counting each token type once per theme
