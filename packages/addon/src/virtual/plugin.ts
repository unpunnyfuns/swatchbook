import type { Config, Project } from '@unpunnyfuns/swatchbook-core';
import { loadProject, projectCss } from '@unpunnyfuns/swatchbook-core';
import { type FSWatcher, watch as fsWatch } from 'node:fs';
import { basename, dirname, isAbsolute, resolve as resolvePath } from 'node:path';
import picomatch from 'picomatch';
import type { Plugin } from 'vite';
import { RESOLVED_VIRTUAL_MODULE_ID, VIRTUAL_MODULE_ID } from '#/constants.ts';

export interface SwatchbookPluginOptions {
  config: Config;
  cwd: string;
}

/**
 * Vite plugin that serves the virtual `virtual:swatchbook/tokens` module —
 * a single source of truth for themes, resolved token maps, per-theme CSS,
 * and diagnostics. Watches the token files + resolver for changes and
 * invalidates the module so HMR reloads the preview with fresh data.
 */
export function swatchbookTokensPlugin({ config, cwd }: SwatchbookPluginOptions): Plugin {
  let project: Project | undefined;
  let css = '';

  async function refresh(): Promise<void> {
    project = await loadProject(config, cwd);
    css = projectCss(project);
  }

  return {
    name: 'swatchbook:virtual-tokens',
    enforce: 'pre',

    async buildStart() {
      await refresh();
    },

    resolveId(id) {
      if (id === VIRTUAL_MODULE_ID) return RESOLVED_VIRTUAL_MODULE_ID;
      return null;
    },

    load(id) {
      if (id !== RESOLVED_VIRTUAL_MODULE_ID) return null;
      if (!project) return 'export default null;';
      // Emit a typed ESM module. Values are JSON-stringified for stability.
      return [
        `/* swatchbook virtual module — generated */`,
        `export const axes = ${JSON.stringify(project.axes)};`,
        `export const presets = ${JSON.stringify(project.presets)};`,
        `export const disabledAxes = ${JSON.stringify(project.disabledAxes)};`,
        `export const themes = ${JSON.stringify(project.themes)};`,
        `export const defaultTheme = ${JSON.stringify(project.themes[0]?.name ?? null)};`,
        `export const themesResolved = ${JSON.stringify(project.themesResolved)};`,
        `export const diagnostics = ${JSON.stringify(project.diagnostics)};`,
        `export const css = ${JSON.stringify(css)};`,
        `export const cssVarPrefix = ${JSON.stringify(config.cssVarPrefix ?? '')};`,
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
            const tokenCount = project
              ? Object.keys(project.themesResolved[project.themes[0]?.name ?? ''] ?? {}).length
              : 0;
            const diagCount = project?.diagnostics.length ?? 0;
            server.config.logger.info(
              `\x1b[36m[swatchbook]\x1b[0m tokens reloaded — ${tokenCount} tokens, ${diagCount} diagnostic${diagCount === 1 ? '' : 's'}`,
              { clear: false, timestamp: true },
            );
            const mod = server.moduleGraph.getModuleById(RESOLVED_VIRTUAL_MODULE_ID);
            if (mod) server.moduleGraph.invalidateModule(mod);
            server.ws.send({ type: 'full-reload' });
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
