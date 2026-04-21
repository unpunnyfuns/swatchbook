---
'@unpunnyfuns/swatchbook-mcp': minor
'@unpunnyfuns/swatchbook-addon': minor
---

feat(mcp): new `@unpunnyfuns/swatchbook-mcp` Model Context Protocol server

Exposes a swatchbook DTCG project to AI agents — `list_tokens` (filter
by path glob + `$type`), `get_token` (full detail + alias chain +
per-theme resolved values + CSS var reference), `list_axes` (axes /
themes / presets), `get_diagnostics`. Runs without Storybook, parses
the project once at startup via `@unpunnyfuns/swatchbook-core`.

Consume as a CLI:

```sh
npx @unpunnyfuns/swatchbook-mcp --config swatchbook.config.ts
```

Or wire into an MCP client (Claude Desktop, etc.) via the same
command. Ships with `createServer` + `loadFromConfig` exports for
programmatic embedding in larger toolchains.

Joins the fixed-version group alongside core / addon / blocks /
switcher so the whole set releases together.
