import type {
  Config,
  ListedToken,
  Project,
  SwatchbookIntegration,
  TokenListingByPath,
} from '@unpunnyfuns/swatchbook-core';
import { emitAxisProjectedCss, loadProject, projectCss } from '@unpunnyfuns/swatchbook-core';
import { type FSWatcher, watch as fsWatch } from 'node:fs';
import { basename, dirname, isAbsolute, resolve as resolvePath } from 'node:path';
import picomatch from 'picomatch';
import type { Plugin } from 'vite';
import {
  HMR_EVENT,
  INTEGRATION_SIDE_EFFECTS_VIRTUAL_ID,
  RESOLVED_INTEGRATION_SIDE_EFFECTS_VIRTUAL_ID,
  RESOLVED_VIRTUAL_MODULE_ID,
  VIRTUAL_MODULE_ID,
} from '#/constants.ts';

export interface SwatchbookPluginOptions {
  config: Config;
  cwd: string;
  /** Display-side integrations — each may contribute a virtual module the preview imports. */
  integrations?: readonly SwatchbookIntegration[];
  /**
   * Which CSS emitter to use for the virtual module's `css` export.
   * `'projected'` (default) calls the smart `emitAxisProjectedCss`;
   * `'cartesian'` calls `projectCss` for explicit per-tuple fan-out.
   * See `AddonOptions.emitMode` for trade-offs.
   */
  emitMode?: 'cartesian' | 'projected';
}

/** `\0<virtualId>` — Vite convention for resolved virtual module IDs. */
function resolvedId(virtualId: string): string {
  return `\0${virtualId}`;
}

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
  emitMode = 'projected',
}: SwatchbookPluginOptions): Plugin {
  let project: Project | undefined;
  let css = '';

  async function refresh(): Promise<void> {
    project = await loadProject(config, cwd);
    css = composeProjectCss(project, emitMode);
  }

  /** Map of resolvedId → integration, indexed once. */
  const integrationById = new Map<string, SwatchbookIntegration>();
  /** Virtual IDs the preview auto-imports as side effects (global CSS). */
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

    async buildStart() {
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
      // Emit a typed ESM module. Values are JSON-stringified for stability.
      // `jointOverrides` ships as an array of `[key, entry]` pairs because
      // `Map` doesn't survive `JSON.stringify`; the block side reconstructs
      // the Map (or just reads the array, depending on the consumer).
      const jointOverridesArr = [...project.jointOverrides.entries()];
      const varianceByPathObj = Object.fromEntries(project.varianceByPath.entries());
      return [
        `/* swatchbook virtual module — generated */`,
        `export const axes = ${JSON.stringify(project.axes)};`,
        `export const presets = ${JSON.stringify(project.presets)};`,
        `export const disabledAxes = ${JSON.stringify(project.disabledAxes)};`,
        `export const permutations = ${JSON.stringify(project.permutations)};`,
        `export const defaultPermutation = ${JSON.stringify(project.permutations[0]?.name ?? null)};`,
        `export const permutationsResolved = ${JSON.stringify(project.permutationsResolved)};`,
        `export const diagnostics = ${JSON.stringify(project.diagnostics)};`,
        `export const css = ${JSON.stringify(css)};`,
        `export const cssVarPrefix = ${JSON.stringify(config.cssVarPrefix ?? '')};`,
        `export const listing = ${JSON.stringify(slimListing(project.listing))};`,
        `export const cells = ${JSON.stringify(project.cells)};`,
        `export const jointOverrides = ${JSON.stringify(jointOverridesArr)};`,
        `export const varianceByPath = ${JSON.stringify(varianceByPathObj)};`,
        `export const defaultTuple = ${JSON.stringify(project.defaultTuple)};`,
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

      /**
       * Editors typically emit two or three filesystem events per save
       * (atomic rename + rewrite + metadata). A 100 ms trailing debounce
       * coalesces those into a single reload while staying well under
       * user-perceptible latency.
       */
      let pending: ReturnType<typeof setTimeout> | null = null;
      const invalidate = (): void => {
        if (pending) clearTimeout(pending);
        pending = setTimeout(() => {
          pending = null;
          void (async () => {
            await refresh();
            if (!project) return;
            const tokenCount = Object.keys(
              project.permutationsResolved[project.permutations[0]?.name ?? ''] ?? {},
            ).length;
            const diagCount = project.diagnostics.length;
            server.config.logger.info(
              `\x1b[36m[swatchbook]\x1b[0m tokens reloaded — ${tokenCount} tokens, ${diagCount} diagnostic${diagCount === 1 ? '' : 's'}`,
              { clear: false, timestamp: true },
            );
            const mod = server.moduleGraph.getModuleById(RESOLVED_VIRTUAL_MODULE_ID);
            if (mod) server.moduleGraph.invalidateModule(mod);
            // Invalidate every integration-contributed virtual module so
            // its body re-renders against the fresh project on the next
            // request.
            for (const resolvedIntegrationId of integrationById.keys()) {
              const m = server.moduleGraph.getModuleById(resolvedIntegrationId);
              if (m) server.moduleGraph.invalidateModule(m);
            }
            /**
             * Send the fresh snapshot as a custom HMR event instead of a
             * full-reload. The preview subscribes and re-broadcasts to
             * blocks via the Storybook channel so the React tree
             * re-renders in place without losing toolbar / args / scroll
             * state. Field shape matches the INIT_EVENT payload so the
             * preview can hand it straight through.
             */
            server.ws.send({
              type: 'custom',
              event: HMR_EVENT,
              data: {
                axes: project.axes,
                disabledAxes: project.disabledAxes,
                presets: project.presets,
                permutations: project.permutations,
                defaultPermutation: project.permutations[0]?.name ?? null,
                permutationsResolved: project.permutationsResolved,
                diagnostics: project.diagnostics,
                css,
                cssVarPrefix: config.cssVarPrefix ?? '',
                listing: slimListing(project.listing),
                cells: project.cells,
                jointOverrides: [...project.jointOverrides.entries()],
                varianceByPath: Object.fromEntries(project.varianceByPath.entries()),
                defaultTuple: project.defaultTuple,
              },
            });
          })();
        }, 100);
      };

      /**
       * Watch each source file's *parent directory* rather than the file
       * itself. File-level `fs.watch` is fragile: atomic-save editors
       * unlink the old inode and write a new one, so the original
       * watcher either fires a one-shot 'rename' and goes deaf, or on
       * some platforms loops on ghost events for the old inode. Watching
       * the dir sidesteps both — the dir inode is stable across the
       * rename dance — and filename filtering keeps event volume low.
       *
       * Vite's `server.watcher` still wouldn't carry these events across
       * pnpm symlink boundaries, so we keep running our own watchers.
       */
      const byDir = new Map<string, Set<string>>();
      for (const file of project?.sourceFiles ?? []) {
        const dir = dirname(file);
        const set = byDir.get(dir) ?? new Set<string>();
        set.add(basename(file));
        byDir.set(dir, set);
      }

      const fileWatchers: FSWatcher[] = [];
      for (const [dir, names] of byDir) {
        try {
          const w = fsWatch(dir, { persistent: false }, (eventType, filename) => {
            if (!filename) return;
            if (!names.has(filename)) return;
            if (eventType === 'change' || eventType === 'rename') invalidate();
          });
          fileWatchers.push(w);
        } catch {
          // unwatchable dir — skip. Next loadProject pass will report it.
        }
      }
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
 */
/** @internal Exported for tests; not part of the public API. */
export function collectWatchPaths(
  config: Config,
  project: Project | undefined,
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

/**
 * Dispatch between the two CSS emitters based on `emitMode`. Extracted
 * from the plugin's closure so unit tests can verify the dispatch
 * without booting Vite — pass a project + mode, get the matching CSS.
 *
 * The plugin defaults to `'projected'` (the smart axis-projected
 * emitter); `'cartesian'` calls `projectCss` for explicit per-tuple
 * fan-out.
 *
 * @internal Exported for tests; not part of the public API.
 */
export function composeProjectCss(
  project: Project,
  emitMode: 'cartesian' | 'projected' = 'projected',
): string {
  if (emitMode === 'cartesian') return projectCss(project);
  return emitAxisProjectedCss(project);
}

type SlimListedToken = Pick<
  ListedToken['$extensions']['app.terrazzo.listing'],
  'names' | 'previewValue' | 'source'
>;

/**
 * Reduce the full Token Listing surface down to the fields blocks read.
 * Drops `originalValue` (large, not needed for display), `$value`, `$type`,
 * `mode`, `subtype` for now — the blocks don't consume them yet. Keeps the
 * virtual module payload lean, especially for large projects where each
 * token's raw listing entry can weigh a few KB.
 */
function slimListing(listing: TokenListingByPath): Record<string, SlimListedToken> {
  const out: Record<string, SlimListedToken> = {};
  for (const [path, entry] of Object.entries(listing)) {
    const ext = entry.$extensions['app.terrazzo.listing'];
    const slim: SlimListedToken = { names: ext.names };
    if (ext.previewValue !== undefined) slim.previewValue = ext.previewValue;
    if (ext.source !== undefined) slim.source = ext.source;
    out[path] = slim;
  }
  return out;
}
