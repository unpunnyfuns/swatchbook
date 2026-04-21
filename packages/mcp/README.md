# MCP

Published as `@unpunnyfuns/swatchbook-mcp`. Model Context Protocol server for swatchbook — exposes a DTCG project's tokens, axes, and diagnostics to AI agents without running Storybook.

> **Documentation:** [unpunnyfuns.github.io/swatchbook](https://unpunnyfuns.github.io/swatchbook/). Token parsing powered by [Terrazzo](https://terrazzo.app/) via `@unpunnyfuns/swatchbook-core`.

## What it's for

Agents that need to reason about your design tokens — figma-to-token round-trips, alias-chain navigation, CI lint hooks, AI-assisted authoring — without spinning up a Storybook iframe. Point it at your `swatchbook.config.{ts,mts,js,mjs}` and it parses the project on startup, then answers MCP tool calls against the resolved graph.

## Install & run

```sh
npx @unpunnyfuns/swatchbook-mcp --config swatchbook.config.ts
```

Or wire it into an MCP client's config. Claude Desktop (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

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

CLI flags:

| Flag             | What                                                                                      |
| ---------------- | ----------------------------------------------------------------------------------------- |
| `--config <path>` | Required. Path to a `swatchbook.config.{ts,mts,js,mjs}`.                                  |
| `--cwd <path>`    | Override the working directory for resolving relative `resolver` / `tokens` paths.         |
| `--help`          | Print usage and exit.                                                                     |

## Tools

| Tool                  | Inputs                                                   | Returns                                                                                                       |
| --------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `describe_project`    | (none)                                                    | High-level overview — token counts, axes, themes, presets, diagnostic counts, `$type`s present.                |
| `list_tokens`         | `filter?` path glob, `type?` DTCG `$type`, `theme?` name | Array of `{ path, type?, value }` from the named theme (or default). Use first to discover paths.             |
| `search_tokens`       | `query`, `theme?`, `limit?`                               | Case-insensitive substring search across paths, descriptions, and values. Returns matches + `matchedIn` hint. |
| `resolve_theme`       | `tuple`, `filter?`, `type?`                               | Resolved token map for an axis tuple (`{ mode: "Dark", brand: "…" }`). Fills omitted axes from defaults.      |
| `get_token`           | `path`                                                    | Full detail: per-theme value, alias chain, aliased-by list, CSS var reference.                                |
| `get_alias_chain`     | `path`                                                    | Forward alias chain per theme (`path → ... → primitive`). Empty when the token is a primitive.                |
| `get_aliased_by`      | `path`, `maxDepth?`                                       | Backward alias tree — every token that resolves through this path. Breadth-first with cycle protection; default max depth 6. |
| `get_consumer_output` | `path`, `tuple?`                                          | CSS var, resolved value, compound `[data-…]` selector + HTML attrs needed to pin the tuple on `<html>`.        |
| `get_color_formats`   | `path`, `theme?`                                          | Color token rendered in `hex` / `rgb` / `hsl` / `oklch` / `raw`, each with an `outOfGamut` flag.                |
| `list_axes`           | (none)                                                    | Axes + contexts + themes + presets from the project config.                                                   |
| `get_diagnostics`     | `severity?` `'error' \| 'warn' \| 'info'`                 | Parser / resolver / validation diagnostics.                                                                   |
| `emit_css`            | (none)                                                    | Full project stylesheet — `:root` default + per-tuple compound-selector blocks. |

Path globs accept `*` (one segment), `**` (any number of segments trailing or mid-path), or exact dot-paths.

## Programmatic use

You can also construct the server in-process — useful if you're embedding the MCP handler in a larger toolchain:

```ts
import { createServer, loadFromConfig } from '@unpunnyfuns/swatchbook-mcp';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const { project } = await loadFromConfig('swatchbook.config.ts');
const server = createServer(project);
await server.connect(new StdioServerTransport());
```

## See also

- [`@unpunnyfuns/swatchbook-core`](../core) — the loader this server wraps.
- [Project README](../../README.md) — install and wiring flow for the whole toolchain.
- [Model Context Protocol](https://modelcontextprotocol.io/) — the upstream spec.
