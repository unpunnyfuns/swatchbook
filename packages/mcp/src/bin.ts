#!/usr/bin/env node
/**
 * Stdio entry for `npx @unpunnyfuns/swatchbook-mcp --config <path>`.
 *
 * Parses `--config <path>`, optional `--cwd <path>`, loads the project, and
 * binds an MCP server to stdio. Watches the resolved source files + config
 * file so token edits land in subsequent tool calls without restarting the
 * transport. Pass `--no-watch` to opt out (e.g. CI). Loader / watcher errors
 * print to stderr — stdout is reserved for MCP protocol frames.
 */
import { type FSWatcher, watch as fsWatch } from 'node:fs';
import { basename, dirname, isAbsolute, resolve } from 'node:path';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { loadFromConfig } from '#/load-config.ts';
import { createServer } from '#/server.ts';

interface CliArgs {
  config?: string;
  cwd?: string;
  watch: boolean;
}

function parseArgs(argv: readonly string[]): CliArgs {
  const out: CliArgs = { watch: true };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const next = argv[i + 1];
    if ((arg === '--config' || arg === '-c') && next) {
      out.config = next;
      i++;
    } else if (arg === '--cwd' && next) {
      out.cwd = next;
      i++;
    } else if (arg === '--no-watch') {
      out.watch = false;
    } else if (arg === '--help' || arg === '-h') {
      console.log(`swatchbook-mcp — Model Context Protocol server for swatchbook projects

Usage:
  swatchbook-mcp --config <path>              Point at a swatchbook.config.{ts,mts,js,mjs}
                                              or a DTCG resolver.json directly. Bare
                                              resolvers boot with every other config
                                              option at defaults.
  swatchbook-mcp --config <path> --cwd <path> Override the project cwd for relative paths.
  swatchbook-mcp --config <path> --no-watch   Disable live-reload on token / config edits.

Tools exposed:
  describe_project    Orientation — counts, axes, themes, presets, diagnostics.
  list_tokens         List tokens by path glob / \`$type\`.
  search_tokens       Substring search across paths, descriptions, values.
  resolve_theme       Full resolved token map for an axis tuple.
  get_token           Full detail for one token path.
  get_alias_chain     Forward alias chain per theme.
  get_aliased_by      Backward alias tree.
  get_consumer_output CSS var + data-attribute activation for a tuple.
  get_color_formats   hex / rgb / hsl / oklch / raw for a color token.
  list_axes           Axes + contexts + themes + presets.
  get_diagnostics     Project diagnostics (optional severity filter).
  emit_css            Full project stylesheet.`);
      process.exit(0);
    }
  }
  return out;
}

/**
 * Watch the project's source files + config path for edits. Debounces
 * filesystem events (editors fire 2-3 per save) into a single reload per
 * 100 ms burst; on each settle, calls `loadFromConfig` again and swaps the
 * fresh project into the already-connected MCP server.
 *
 * Watches parent directories rather than files themselves. Atomic-save
 * editors unlink + recreate the target inode, which kills file-level
 * watchers on the first save; a dir watcher with filename filtering
 * survives that dance. Mirrors the addon's plugin strategy.
 */
function setupReload(
  initialSourceFiles: readonly string[],
  configPath: string,
  reload: () => Promise<void>,
): () => void {
  const dirs = new Map<string, Set<string>>();
  const add = (file: string): void => {
    const dir = dirname(file);
    const set = dirs.get(dir) ?? new Set<string>();
    set.add(basename(file));
    dirs.set(dir, set);
  };
  for (const file of initialSourceFiles) add(file);
  add(configPath);

  let pending: ReturnType<typeof setTimeout> | null = null;
  const schedule = (): void => {
    if (pending) clearTimeout(pending);
    pending = setTimeout(() => {
      pending = null;
      reload().catch((err) => {
        console.error('swatchbook-mcp: reload failed —', err);
      });
    }, 100);
  };

  const watchers: FSWatcher[] = [];
  for (const [dir, names] of dirs) {
    try {
      const w = fsWatch(dir, { persistent: false }, (eventType, filename) => {
        if (!filename) return;
        if (!names.has(filename)) return;
        if (eventType === 'change' || eventType === 'rename') schedule();
      });
      watchers.push(w);
    } catch {
      // unwatchable dir — skip. The initial load already succeeded, so the
      // server keeps serving the current snapshot.
    }
  }
  return () => {
    if (pending) clearTimeout(pending);
    for (const w of watchers) w.close();
  };
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  if (!args.config) {
    console.error('swatchbook-mcp: --config <path> is required. Use --help for usage.');
    process.exit(1);
  }
  const configAbsolute = isAbsolute(args.config)
    ? args.config
    : resolve(process.cwd(), args.config);

  const { project } = await loadFromConfig(configAbsolute, args.cwd);
  const server = createServer(project);
  const transport = new StdioServerTransport();
  await server.connect(transport);

  if (args.watch) {
    let stopWatchers = setupReload(project.sourceFiles, configAbsolute, () => reload());
    async function reload(): Promise<void> {
      const { project: next } = await loadFromConfig(configAbsolute, args.cwd);
      server.setProject(next);
      const themeCount = next.themes.length;
      const tokenCount = Object.keys(next.themesResolved[next.themes[0]?.name ?? ''] ?? {}).length;
      console.error(
        `swatchbook-mcp: project reloaded — ${tokenCount} tokens across ${themeCount} theme${themeCount === 1 ? '' : 's'}.`,
      );
      // Rebind watchers against the fresh source-file set so newly-referenced
      // tokens / resolvers pick up edits from here on.
      stopWatchers();
      stopWatchers = setupReload(next.sourceFiles, configAbsolute, () => reload());
    }
  }
}

main().catch((err) => {
  console.error('swatchbook-mcp failed to start:', err);
  process.exit(1);
});
