---
'@unpunnyfuns/swatchbook-core': patch
'@unpunnyfuns/swatchbook-integrations': patch
'@unpunnyfuns/swatchbook-mcp': patch
---

fix tailwind/css-in-js integrations and MCP get_token/get_consumer_output reporting CSS var names that diverge from plugin-css output on camelCase paths; names now come from the listing via the new core cssVarName helper
