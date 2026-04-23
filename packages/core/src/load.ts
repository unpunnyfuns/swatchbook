import { validateChrome } from '#/chrome.ts';
import { BufferedLogger, toDiagnostics } from '#/diagnostics.ts';
import { validateDisabledAxes } from '#/disabled-axes.ts';
import { validatePresets } from '#/presets.ts';
import { resolveDefaultTuple } from '#/themes/default.ts';
import { normalizeThemes } from '#/themes/normalize.ts';
import { computeTokenListing } from '#/token-listing.ts';
import {
  permutationID,
  type Axis,
  type Config,
  type Diagnostic,
  type Project,
  type ResolvedTheme,
  type Theme,
  type TokenMap,
} from '#/types.ts';

/**
 * Load a swatchbook project from a config. Themes are eagerly resolved,
 * so downstream consumers can call `resolveTheme(project, name)` or read
 * `project.themesResolved[name]` directly without further I/O.
 *
 * The `cwd` defaults to `process.cwd()`. All relative paths in `config`
 * (token globs, `resolver`, theme layer globs) resolve against this
 * directory.
 */
/** Default `cssVarPrefix` applied when the config omits one. Namespaces
 * emitted vars (`--swatch-…`) and data attributes (`data-swatch-…`) so
 * swatchbook output doesn't collide with whatever else the consumer has
 * claimed in `:root`. Override in config to use a project-specific prefix
 * or set to `''` to opt out of namespacing. */
export const DEFAULT_CSS_VAR_PREFIX = 'swatch';

export async function loadProject(config: Config, cwd: string = process.cwd()): Promise<Project> {
  const logger = new BufferedLogger({ level: 'warn' });
  const configWithDefaults: Config = {
    ...config,
    cssVarPrefix: config.cssVarPrefix ?? DEFAULT_CSS_VAR_PREFIX,
  };
  const normalized = await normalizeThemes(configWithDefaults, cwd, logger);

  const { names: disabledAxes, diagnostics: disabledDiagnostics } = validateDisabledAxes(
    config.disabledAxes,
    normalized.axes,
  );

  const {
    axes: filteredAxes,
    themes: filteredThemes,
    resolved: filteredResolved,
  } = applyDisabledAxes(normalized.axes, normalized.themes, normalized.resolved, disabledAxes);

  const { tuple: defaultTuple, diagnostics: defaultDiagnostics } = resolveDefaultTuple(
    config.default,
    filteredAxes,
  );
  const computedDefault = permutationID(defaultTuple);
  const defaultThemeName = filteredResolved[computedDefault]
    ? computedDefault
    : (filteredThemes[0]?.name ?? '');

  const graph = filteredResolved[defaultThemeName] ?? {};

  const { presets, diagnostics: presetDiagnostics } = validatePresets(config.presets, filteredAxes);

  const { entries: chrome, diagnostics: chromeDiagnostics } = validateChrome(
    config.chrome,
    filteredResolved,
  );

  // A misconfigured `disabledAxes` (e.g. pinning an axis whose default
  // context has no theme rows) can filter every theme out. We still return
  // an empty project so the addon can render diagnostics instead of
  // crashing, but the cause is easy to miss — the panel just shows an
  // empty tree. Flag it here so users have something actionable to read.
  const projectDiagnostics: Diagnostic[] = [];
  if (disabledAxes.length > 0 && filteredThemes.length === 0) {
    projectDiagnostics.push({
      severity: 'warn',
      group: 'swatchbook/project',
      message: `\`disabledAxes\` ${JSON.stringify(disabledAxes)} filtered out every theme — nothing left to render. Check that the pinned axes' default contexts are represented in the resolver's permutations.`,
    });
  }

  const listing =
    normalized.parserInput !== undefined
      ? await computeTokenListing(
          normalized.parserInput,
          cwd,
          configWithDefaults.cssVarPrefix ?? '',
          {
            ...(config.cssOptions !== undefined && { cssOptions: config.cssOptions }),
            ...(config.listingOptions !== undefined && { listingOptions: config.listingOptions }),
            ...(config.terrazzoPlugins !== undefined && { extraPlugins: config.terrazzoPlugins }),
          },
        )
      : {};

  return {
    config: configWithDefaults,
    axes: filteredAxes,
    disabledAxes,
    presets,
    chrome,
    themes: filteredThemes,
    themesResolved: filteredResolved,
    graph,
    sourceFiles: normalized.sourceFiles,
    cwd,
    ...(normalized.parserInput !== undefined && { parserInput: normalized.parserInput }),
    listing,
    diagnostics: [
      ...toDiagnostics(logger),
      ...normalized.diagnostics,
      ...disabledDiagnostics,
      ...defaultDiagnostics,
      ...presetDiagnostics,
      ...chromeDiagnostics,
      ...projectDiagnostics,
    ],
  };
}

/**
 * Project `disabledAxes` onto the loader output: drop disabled axes from
 * the axis list, keep only the themes whose disabled-axis values equal
 * their axis defaults, and prune `resolved` to the surviving theme names.
 * Returns the original triple unchanged when `disabled` is empty.
 */
function applyDisabledAxes(
  axes: Axis[],
  themes: Theme[],
  resolved: Record<string, TokenMap>,
  disabled: string[],
): { axes: Axis[]; themes: Theme[]; resolved: Record<string, TokenMap> } {
  if (disabled.length === 0) return { axes, themes, resolved };

  const disabledSet = new Set(disabled);
  const axisDefaults = new Map<string, string>();
  for (const axis of axes) axisDefaults.set(axis.name, axis.default);

  const filteredAxes = axes.filter((a) => !disabledSet.has(a.name));
  const filteredThemes = themes.filter((theme) => {
    for (const name of disabled) {
      if (theme.input[name] !== axisDefaults.get(name)) return false;
    }
    return true;
  });
  const surviving = new Set(filteredThemes.map((t) => t.name));
  const filteredResolved: Record<string, TokenMap> = {};
  for (const [name, tokens] of Object.entries(resolved)) {
    if (surviving.has(name)) filteredResolved[name] = tokens;
  }
  return { axes: filteredAxes, themes: filteredThemes, resolved: filteredResolved };
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
