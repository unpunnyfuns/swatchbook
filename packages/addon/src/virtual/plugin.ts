import type { Config, Project, SwatchbookIntegration } from '@unpunnyfuns/swatchbook-core';
import { emitAxisProjectedCss, loadProject } from '@unpunnyfuns/swatchbook-core';
import { listPaths } from '@unpunnyfuns/swatchbook-core/graph';
import { snapshotForWire } from '@unpunnyfuns/swatchbook-core/snapshot-for-wire';
import { watch as fsWatch } from 'node:fs';
import type { FSWatcher } from 'node:fs';
import { dirname, extname, isAbsolute, resolve as resolvePath } from 'node:path';
import picomatch from 'picomatch';
import type { Plugin, ViteDevServer } from 'vite';
import {
  HMR_EVENT,
  INTEGRATION_SIDE_EFFECTS_VIRTUAL_ID,
  RESOLVED_INTEGRATION_SIDE_EFFECTS_VIRTUAL_ID,
  RESOLVED_VIRTUAL_MODULE_ID,
  VIRTUAL_MODULE_ID,
} from '#/constants.ts';

export interface SwatchbookTokensPluginOptions {
  config: Config;
  cwd: string;
  /** Display-side integrations — each may contribute a virtual module the preview imports. */
  integrations?: readonly SwatchbookIntegration[];
  /**
   * Pre-loaded project to use for the first `buildStart` instead of
   * calling `loadProject` again. Shares `preset.viteFinal`'s single
   * `loadProject` call with the plugin so Storybook startup doesn't parse
   * twice. HMR-triggered reloads still call `loadProject` directly.
   */
  initialProject?: Project;
}

// `\0<virtualId>` — Vite convention for resolved virtual module IDs.
function resolvedId(virtualId: string): string {
  return `\0${virtualId}`;
}

// File extensions the dir watcher treats as token sources. Watching a
// directory surfaces every change in it; this filter keeps editor temp
// files, `.DS_Store`, etc. from triggering reloads while still catching
// newly-added token files (the frozen-basename filter previously missed).
const TOKEN_FILE_EXTENSIONS = new Set(['.json', '.jsonc', '.json5', '.yaml', '.yml']);

/**
 * Vite plugin that serves the virtual `virtual:swatchbook/tokens` module —
 * a single source of truth for permutations, resolved token maps, per-theme CSS,
 * and diagnostics. Watches the token files + resolver for changes and
 * invalidates the module so HMR reloads the preview with fresh data.
 */
export function swatchbookTokensPlugin({
  config,
  cwd,
  integrations = [],
  initialProject,
}: SwatchbookTokensPluginOptions): Plugin {
  let project: Project | undefined = initialProject;
  let css = project ? emitAxisProjectedCss(project) : '';

  async function refresh(): Promise<void> {
    project = await loadProject(config, cwd);
    css = emitAxisProjectedCss(project);
  }

  // One reload pass: refresh the project, invalidate the virtual modules,
  // broadcast the fresh snapshot. Never rejects — a rejection escaping the
  // watcher's fire-and-forget call is an unhandled rejection that kills
  // the dev-server process on a transient bad save. Failures log and the
  // previous project keeps serving (`refresh` only reassigns on success).
  async function reload(server: ViteDevServer): Promise<void> {
    try {
      await refresh();
    } catch (error) {
      server.config.logger.error(
        `\x1b[36m[swatchbook]\x1b[0m token reload failed — keeping previous tokens: ${error instanceof Error ? error.message : String(error)}`,
        { clear: false, timestamp: true },
      );
      return;
    }
    if (!project) return;
    const tokenCount = [...listPaths(project.tokenGraph)].length;
    const diagCount = project.diagnostics.length;
    server.config.logger.info(
      `\x1b[36m[swatchbook]\x1b[0m tokens reloaded — ${tokenCount} tokens, ${diagCount} diagnostic${diagCount === 1 ? '' : 's'}`,
      { clear: false, timestamp: true },
    );
    const mod = server.moduleGraph.getModuleById(RESOLVED_VIRTUAL_MODULE_ID);
    if (mod) server.moduleGraph.invalidateModule(mod);
    // Invalidate every integration-contributed virtual module so its body
    // re-renders against the fresh project on the next request.
    for (const resolvedIntegrationId of integrationById.keys()) {
      const m = server.moduleGraph.getModuleById(resolvedIntegrationId);
      if (m) server.moduleGraph.invalidateModule(m);
    }
    // Send the fresh snapshot as a custom HMR event instead of a
    // full-reload. The preview subscribes and re-broadcasts to blocks via
    // the Storybook channel so the React tree re-renders in place without
    // losing toolbar / args / scroll state. Field shape matches the
    // INIT_EVENT payload so the preview can hand it straight through.
    server.ws.send({
      type: 'custom',
      event: HMR_EVENT,
      data: snapshotForWire(project, css),
    });
  }

  // Map of resolvedId → integration, indexed once.
  const integrationById = new Map<string, SwatchbookIntegration>();
  // Virtual IDs the preview auto-imports as side effects (global CSS).
  const autoInjectIds: string[] = [];
  for (const integration of integrations) {
    const vm = integration.virtualModule;
    if (!vm) continue;
    integrationById.set(resolvedId(vm.virtualId), integration);
    if (vm.autoInject) autoInjectIds.push(vm.virtualId);
  }

  return {
    name: 'swatchbook:virtual-tokens',
    enforce: 'pre',

    // Vite's plugin-to-plugin/testing escape hatch. `reload` is the same
    // pass the debounced fs watcher fires; exposed so tests can exercise
    // the failure contract without real watcher events.
    api: { reload },

    // Vite uses esbuild for `optimizeDeps` pre-bundling (development
    // mode), and esbuild doesn't see Rollup-style `resolveId` hooks.
    // Without this exclusion, a preview file that imports
    // `virtual:swatchbook/tokens` (directly or via the addon's
    // `useToken` hook) can get pulled into pre-bundling, hitting
    // esbuild with no resolver registered and failing with
    // `Could not resolve "virtual:swatchbook/tokens"`.
    //
    // Excluding the virtual IDs tells Vite to route them through the
    // Rollup-style pipeline at request time — our `resolveId` / `load`
    // hooks above handle the resolution. Build mode is unaffected
    // (build uses Rollup throughout).
    config() {
      return {
        optimizeDeps: {
          exclude: [VIRTUAL_MODULE_ID, INTEGRATION_SIDE_EFFECTS_VIRTUAL_ID],
        },
      };
    },

    async buildStart() {
      // Skip the redundant load when preset.viteFinal already supplied
      // a freshly-loaded project via `initialProject`. The first HMR
      // reload (or a manual `refresh()`) calls `loadProject` as usual.
      if (project) return;
      await refresh();
    },

    resolveId(id) {
      if (id === VIRTUAL_MODULE_ID) return RESOLVED_VIRTUAL_MODULE_ID;
      if (id === INTEGRATION_SIDE_EFFECTS_VIRTUAL_ID) {
        return RESOLVED_INTEGRATION_SIDE_EFFECTS_VIRTUAL_ID;
      }
      for (const integration of integrations) {
        if (integration.virtualModule?.virtualId === id) {
          return resolvedId(integration.virtualModule.virtualId);
        }
      }
      return null;
    },

    load(id) {
      if (id === RESOLVED_INTEGRATION_SIDE_EFFECTS_VIRTUAL_ID) {
        // Aggregate side-effect imports. Empty when no integration
        // opted in — still a valid ESM module, just a no-op.
        return autoInjectIds.map((vid) => `import ${JSON.stringify(vid)};`).join('\n');
      }
      const integration = integrationById.get(id);
      if (integration?.virtualModule) {
        if (!project) return '';
        return integration.virtualModule.render(project);
      }
      if (id !== RESOLVED_VIRTUAL_MODULE_ID) return null;
      if (!project) return 'export default null;';
      // Emit a typed ESM module. `snapshotForWire` does the field set +
      // Map-to-Object conversion in one place; we destructure here and
      // JSON-stringify each field for ESM export.
      const snap = snapshotForWire(project, css);
      return [
        `/* swatchbook virtual module — generated */`,
        `export const axes = ${JSON.stringify(snap.axes)};`,
        `export const presets = ${JSON.stringify(snap.presets)};`,
        `export const disabledAxes = ${JSON.stringify(snap.disabledAxes)};`,
        `export const diagnostics = ${JSON.stringify(snap.diagnostics)};`,
        `export const css = ${JSON.stringify(snap.css)};`,
        `export const cssVarPrefix = ${JSON.stringify(snap.cssVarPrefix)};`,
        `export const defaultColorFormat = ${JSON.stringify(snap.defaultColorFormat)};`,
        `export const indicators = ${JSON.stringify(snap.indicators)};`,
        `export const listing = ${JSON.stringify(snap.listing)};`,
        `export const defaultTuple = ${JSON.stringify(snap.defaultTuple)};`,
        `export const tokenGraph = ${JSON.stringify(snap.tokenGraph)};`,
      ].join('\n');
    },

    async configureServer(server) {
      // `configureServer` fires before `buildStart` in Vite's plugin
      // lifecycle, so `project` is still undefined when consumers only
      // set `config.resolver` (no `tokens` glob). Force an initial load
      // here so the watcher setup below sees a populated `sourceFiles`
      // list — otherwise only the resolver file itself gets watched,
      // and saves to any `$ref` target silently drop.
      if (!project) await refresh();

      // Editors typically emit two or three filesystem events per save
      // (atomic rename + rewrite + metadata). A 100 ms trailing debounce
      // coalesces those into a single reload while staying well under
      // user-perceptible latency.
      let pending: ReturnType<typeof setTimeout> | null = null;
      const invalidate = (): void => {
        if (pending) clearTimeout(pending);
        pending = setTimeout(() => {
          pending = null;
          // Re-arm after each reload: a token edit can add a `$ref` to a
          // file in a directory we weren't watching, and the refreshed
          // `project.sourceFiles` surfaces it.
          void reload(server).then(armWatchers);
        }, 100);
      };

      // Watch the token *directories* rather than individual files. File-
      // level `fs.watch` is fragile: atomic-save editors unlink the old
      // inode and write a new one, so a file watcher fires a one-shot
      // 'rename' and goes deaf. Watching the dir (inode stable across the
      // rename) sidesteps that; an extension filter keeps event volume low.
      //
      // Re-derived on every call (not a basename set frozen at server
      // start) so a newly-added token file in a watched dir triggers a
      // reload. `fs.watch` recursive mode isn't portable to Linux/CI, so we
      // re-arm after reloads to pick up new directories instead.
      //
      // Vite's `server.watcher` wouldn't carry these events across pnpm
      // symlink boundaries, so we run our own watchers.
      let fileWatchers: FSWatcher[] = [];
      function armWatchers(): void {
        for (const w of fileWatchers) w.close();
        fileWatchers = [];
        const dirs = new Set<string>(collectWatchPaths(config, project, cwd));
        for (const file of project?.sourceFiles ?? []) dirs.add(dirname(file));
        for (const dir of dirs) {
          try {
            const w = fsWatch(dir, { persistent: false }, (eventType, filename) => {
              if (!filename) return;
              if (!TOKEN_FILE_EXTENSIONS.has(extname(filename))) return;
              if (eventType === 'change' || eventType === 'rename') invalidate();
            });
            fileWatchers.push(w);
          } catch {
            // unwatchable dir — skip. Next loadProject pass will report it.
          }
        }
      }
      armWatchers();
      server.httpServer?.once('close', () => {
        for (const w of fileWatchers) w.close();
      });
    },
  };
}

/**
 * Collect the set of filesystem paths the dev server should watch for
 * HMR. When `config.tokens` is set, use its globs (stripped to their
 * base directories) — users opt in to broader watching this way. When
 * absent, use the resolver file + every `$ref` target it pulled in, as
 * tracked on `project.sourceFiles` — which stays correct as the resolver
 * evolves without requiring a parallel `tokens` glob.
 *
 * @internal Exported for tests; not part of the public API.
 */
export function collectWatchPaths(
  config: Config,
  project: Pick<Project, 'sourceFiles'> | undefined,
  cwd: string,
): string[] {
  const paths: string[] = [];
  if (config.tokens && config.tokens.length > 0) {
    for (const glob of config.tokens) {
      // `picomatch.scan` yields the longest literal prefix before any glob
      // metachar, so it handles brace expansion, nested globstars, and the
      // other shapes the hand-rolled regex missed.
      const { base } = picomatch.scan(glob);
      paths.push(resolveFromCwd(base || '.', cwd));
    }
  } else if (project?.sourceFiles) {
    for (const file of project.sourceFiles) paths.push(dirname(file));
  }
  if (config.resolver) paths.push(resolveFromCwd(config.resolver, cwd));
  return [...new Set(paths)];
}

function resolveFromCwd(p: string, cwd: string): string {
  if (isAbsolute(p)) return p;
  return resolvePath(cwd, p);
}
