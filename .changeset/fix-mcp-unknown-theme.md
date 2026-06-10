---
'@unpunnyfuns/swatchbook-mcp': patch
---

fix MCP tools silently falling back to the default theme for an unknown theme name while labeling the response with the requested name; they now return an error listing the valid theme names
