---
"@unpunnyfuns/swatchbook-mcp": patch
---

Make the MCP-client wiring instructions client-agnostic across the README and the docs site (`reference/mcp`, `intro`, `developers/architecture`). Previous wording singled out one client by name and embedded a single platform-specific config path; the `mcpServers` JSON shape is the same across MCP hosts, so the wording now lets each host's own docs cover where its server-config file lives.
