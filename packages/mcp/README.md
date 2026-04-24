# swatchbook-mcp

A [Model Context Protocol](https://modelcontextprotocol.io/) server for [swatchbook](https://github.com/unpunnyfuns/swatchbook).

Exposes a DTCG project's tokens, axes, alias chains, and diagnostics to AI agents without running Storybook. Useful for agents doing figma-to-token round-trips, alias-chain navigation, CI lint hooks, AI-assisted token authoring.

Point it at a swatchbook config (or a bare DTCG `resolver.json`) and it parses the project on startup, then answers MCP tool calls against the resolved graph.

## Install & run

```sh
npx @unpunnyfuns/swatchbook-mcp --config swatchbook.config.ts
```

Or wire it into an MCP client. Claude Desktop (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "swatchbook": {
      "command": "npx",
      "args": ["-y", "@unpunnyfuns/swatchbook-mcp", "--config", "/absolute/path/to/swatchbook.config.ts"]
    }
  }
}
```

Live-reload is on by default — the server watches the config and resolved source files, swapping in fresh data on edits. Pass `--no-watch` to disable.

## Programmatic use

For embedding the MCP handler in a larger toolchain:

```ts
import { createServer, loadFromConfig } from '@unpunnyfuns/swatchbook-mcp';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const { project } = await loadFromConfig('swatchbook.config.ts');
const server = createServer(project);
await server.connect(new StdioServerTransport());
```

## Tools

Fourteen read-only tools covering token listing, search, theme resolution, alias chains, color formats + contrast, axis variance, and diagnostics. Full catalogue in the [MCP reference](https://unpunnyfuns.github.io/swatchbook/reference/mcp).

## Credits

Token parsing and resolver evaluation come from [Terrazzo](https://terrazzo.app/) by the [Terrazzo team](https://github.com/terrazzoapp) via `@unpunnyfuns/swatchbook-core`.

## Documentation

[unpunnyfuns.github.io/swatchbook](https://unpunnyfuns.github.io/swatchbook/) — concepts, guides, and full API reference.
