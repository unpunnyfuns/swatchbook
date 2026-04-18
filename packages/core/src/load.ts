import { BufferedLogger, toDiagnostics } from '#/diagnostics.ts';
import { validatePresets } from '#/presets.ts';
import { normalizeThemes } from '#/themes/normalize.ts';
import type { Config, Project, ResolvedTheme } from '#/types.ts';

/**
 * Load a swatchbook project from a config. Themes are eagerly resolved,
 * so downstream consumers can call `resolveTheme(project, name)` or read
 * `project.themesResolved[name]` directly without further I/O.
 *
 * The `cwd` defaults to `process.cwd()`. All relative paths in `config`
 * (token globs, `resolver`, `manifest`, theme layer globs) resolve
 * against this directory.
 */
export async function loadProject(config: Config, cwd: string = process.cwd()): Promise<Project> {
  const logger = new BufferedLogger({ level: 'warn' });
  const normalized = await normalizeThemes(config, cwd, logger);

  const graph = normalized.resolved[normalized.defaultThemeName] ?? {};

  const { presets, diagnostics: presetDiagnostics } = validatePresets(
    config.presets,
    normalized.axes,
  );

  return {
    config,
    axes: normalized.axes,
    presets,
    themes: normalized.themes,
    themesResolved: normalized.resolved,
    graph,
    diagnostics: [...toDiagnostics(logger), ...presetDiagnostics],
  };
}

/** Fetch the resolved tokens for a named theme. Throws if the name is unknown. */
export function resolveTheme(project: Project, name: string): ResolvedTheme {
  const tokens = project.themesResolved[name];
  if (!tokens) {
    const known = project.themes.map((t) => t.name).join(', ');
    throw new Error(`swatchbook: unknown theme "${name}". Known: ${known || '(none)'}`);
  }
  return { name, tokens };
}
