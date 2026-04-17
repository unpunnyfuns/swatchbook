import type { Config, Project } from '@unpunnyfuns/swatchbook-core';
import { loadProject, projectCss } from '@unpunnyfuns/swatchbook-core';
import type { Plugin } from 'vite';
import { RESOLVED_VIRTUAL_MODULE_ID, VIRTUAL_MODULE_ID } from '#/constants';

export interface SwatchbookPluginOptions {
  config: Config;
  cwd: string;
}

/**
 * Vite plugin that serves the virtual `virtual:swatchbook/tokens` module —
 * a single source of truth for themes, resolved token maps, per-theme CSS,
 * and diagnostics. Watches the token files + manifest/resolver for changes
 * and invalidates the module so HMR reloads the preview with fresh data.
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
        `export const themes = ${JSON.stringify(project.themes)};`,
        `export const defaultTheme = ${JSON.stringify(project.themes[0]?.name ?? null)};`,
        `export const themesResolved = ${JSON.stringify(project.themesResolved)};`,
        `export const diagnostics = ${JSON.stringify(project.diagnostics)};`,
        `export const css = ${JSON.stringify(css)};`,
        `export const cssVarPrefix = ${JSON.stringify(config.cssVarPrefix ?? '')};`,
      ].join('\n');
    },

    configureServer(server) {
      const watchPaths = collectWatchPaths(config, cwd);
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

function collectWatchPaths(config: Config, cwd: string): string[] {
  const paths: string[] = [];
  for (const glob of config.tokens) {
    // Strip the glob portion and watch the base directory.
    const base = glob.replace(/\/\*.*$/, '').replace(/\/[^/]*\*.*$/, '');
    paths.push(resolveFromCwd(base, cwd));
  }
  if (config.manifest) paths.push(resolveFromCwd(config.manifest, cwd));
  if (config.resolver) paths.push(resolveFromCwd(config.resolver, cwd));
  return [...new Set(paths)];
}

function resolveFromCwd(p: string, cwd: string): string {
  if (p.startsWith('/')) return p;
  return `${cwd}/${p}`;
}
