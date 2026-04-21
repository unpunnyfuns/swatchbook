#!/usr/bin/env node
/**
 * Stdio entry for `npx @unpunnyfuns/swatchbook-mcp --config <path>`.
 *
 * Minimal CLI: parses `--config <path>`, optional `--cwd <path>`, loads the
 * project, and binds an MCP server to stdio. Any loader error prints to
 * stderr with a non-zero exit; anything else happens over the MCP protocol.
 */
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { loadFromConfig } from '#/load-config.ts';
import { createServer } from '#/server.ts';

function parseArgs(argv: readonly string[]): { config?: string; cwd?: string } {
  const out: { config?: string; cwd?: string } = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const next = argv[i + 1];
    if ((arg === '--config' || arg === '-c') && next) {
      out.config = next;
      i++;
    } else if (arg === '--cwd' && next) {
      out.cwd = next;
      i++;
    } else if (arg === '--help' || arg === '-h') {
      console.log(`swatchbook-mcp — Model Context Protocol server for swatchbook projects

Usage:
  swatchbook-mcp --config <path>              Point at a swatchbook.config.{ts,mts,js,mjs}
                                              or a DTCG resolver.json directly. Bare
                                              resolvers boot with every other config
                                              option at defaults.
  swatchbook-mcp --config <path> --cwd <path> Override the project cwd for relative paths

Tools exposed:
  list_tokens       List tokens by path glob / \`$type\`.
  get_token         Full detail for one token path.
  list_axes         Axes + contexts + themes + presets.
  get_diagnostics   Project diagnostics (optional severity filter).`);
      process.exit(0);
    }
  }
  return out;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  if (!args.config) {
    console.error('swatchbook-mcp: --config <path> is required. Use --help for usage.');
    process.exit(1);
  }
  const { project } = await loadFromConfig(args.config, args.cwd);
  const server = createServer(project);
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error('swatchbook-mcp failed to start:', err);
  process.exit(1);
});
