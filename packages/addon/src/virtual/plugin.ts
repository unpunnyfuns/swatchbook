import type { Config, Project } from '@unpunnyfuns/swatchbook-core';
import { loadProject, projectCss } from '@unpunnyfuns/swatchbook-core';
import { dirname, isAbsolute, resolve as resolvePath } from 'node:path';
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

    configureServer(server) {
      const watchPaths = collectWatchPaths(config, project, cwd);
      for (const p of watchPaths) server.watcher.add(p);

      const invalidate = async (): Promise<void> => {
        await refresh();
        const mod = server.moduleGraph.getModuleById(RESOLVED_VIRTUAL_MODULE_ID);
        if (mod) server.moduleGraph.invalidateModule(mod);
        server.ws.send({ type: 'full-reload' });
      };

      server.watcher.on('change', (changed) => {
        if (watchPaths.some((p) => changed === p || changed.startsWith(p))) {
          void invalidate();
        }
      });
      server.watcher.on('add', (changed) => {
        if (watchPaths.some((p) => changed.startsWith(p))) void invalidate();
      });
      server.watcher.on('unlink', (changed) => {
        if (watchPaths.some((p) => changed.startsWith(p))) void invalidate();
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
function collectWatchPaths(config: Config, project: Project | undefined, cwd: string): string[] {
  const paths: string[] = [];
  if (config.tokens && config.tokens.length > 0) {
    for (const glob of config.tokens) {
      const base = glob.replace(/\/\*.*$/, '').replace(/\/[^/]*\*.*$/, '');
      paths.push(resolveFromCwd(base, cwd));
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
