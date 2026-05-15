import { validateChrome } from '#/chrome.ts';
import { BufferedLogger, toDiagnostics } from '#/diagnostics.ts';
import { validateDisabledAxes } from '#/disabled-axes.ts';
import { fillPresetTuple, validatePresets } from '#/presets.ts';
import { validateCssOptions } from '#/terrazzo-options.ts';
import { resolveDefaultTuple } from '#/permutations/default.ts';
import { normalizePermutations } from '#/permutations/normalize.ts';
import { computeTokenListing } from '#/token-listing.ts';
import {
  permutationID,
  type Axis,
  type Config,
  type Diagnostic,
  type Permutation,
  type Project,
  type ResolvedPermutation,
  type TokenMap,
} from '#/types.ts';

/**
 * Load a swatchbook project from a config. Permutations are eagerly
 * resolved, so downstream consumers can call
 * `resolvePermutation(project, name)` or read
 * `project.permutationsResolved[name]` directly without further I/O.
 *
 * The `cwd` defaults to `process.cwd()`. All relative paths in `config`
 * (token globs, `resolver`, layered axis overlay globs) resolve against
 * this directory.
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
  const normalized = await normalizePermutations(configWithDefaults, cwd, logger);

  const { names: disabledAxes, diagnostics: disabledDiagnostics } = validateDisabledAxes(
    config.disabledAxes,
    normalized.axes,
  );

  const {
    axes: filteredAxes,
    permutations: filteredPermutations,
    resolved: filteredResolved,
  } = applyDisabledAxes(
    normalized.axes,
    normalized.permutations,
    normalized.resolved,
    disabledAxes,
  );

  const { tuple: defaultTuple, diagnostics: defaultDiagnostics } = resolveDefaultTuple(
    config.default,
    filteredAxes,
  );
  const computedDefault = permutationID(defaultTuple);
  const defaultPermutationName = filteredResolved[computedDefault]
    ? computedDefault
    : (filteredPermutations[0]?.name ?? '');

  const graph = filteredResolved[defaultPermutationName] ?? {};

  const { presets, diagnostics: presetDiagnostics } = validatePresets(config.presets, filteredAxes);

  // Materialize any preset tuples the loader didn't enumerate. Happens
  // under the `maxPermutations` guard: only the default permutation was
  // loaded, but the consumer's presets need their tokens too so the
  // toolbar's preset pills resolve correctly. Resolver-backed projects
  // only — layered presets without a resolver can't apply() on demand.
  if (normalized.parserInput?.resolver && presets.length > 0) {
    for (const preset of presets) {
      const tuple = fillPresetTuple(preset.axes, filteredAxes);
      const id = permutationID(tuple);
      if (filteredResolved[id]) continue;
      filteredResolved[id] = normalized.parserInput.resolver.apply(tuple);
      filteredPermutations.push({ name: id, input: tuple, sources: [] });
    }
  }

  const { entries: chrome, diagnostics: chromeDiagnostics } = validateChrome(
    config.chrome,
    filteredResolved,
  );

  const { diagnostics: cssOptionsDiagnostics } = validateCssOptions(config.cssOptions);

  // A misconfigured `disabledAxes` (e.g. pinning an axis whose default
  // context has no permutation rows) can filter every permutation out.
  // We still return an empty project so the addon can render diagnostics
  // instead of crashing, but the cause is easy to miss — the panel just
  // shows an empty tree. Flag it here so users have something actionable.
  const projectDiagnostics: Diagnostic[] = [];
  if (disabledAxes.length > 0 && filteredPermutations.length === 0) {
    projectDiagnostics.push({
      severity: 'warn',
      group: 'swatchbook/project',
      message: `\`disabledAxes\` ${JSON.stringify(disabledAxes)} filtered out every permutation — nothing left to render. Check that the pinned axes' default contexts are represented in the resolver's permutations.`,
    });
  }

  const { listing, diagnostics: listingDiagnostics } =
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
      : { listing: {}, diagnostics: [] };

  return {
    config: configWithDefaults,
    axes: filteredAxes,
    disabledAxes,
    presets,
    chrome,
    permutations: filteredPermutations,
    permutationsResolved: filteredResolved,
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
      ...cssOptionsDiagnostics,
      ...listingDiagnostics,
      ...projectDiagnostics,
    ],
  };
}

/**
 * Project `disabledAxes` onto the loader output: drop disabled axes from
 * the axis list, keep only the permutations whose disabled-axis values
 * equal their axis defaults, and prune `resolved` to the surviving
 * permutation names. Returns the original triple unchanged when
 * `disabled` is empty.
 */
function applyDisabledAxes(
  axes: Axis[],
  permutations: Permutation[],
  resolved: Record<string, TokenMap>,
  disabled: string[],
): { axes: Axis[]; permutations: Permutation[]; resolved: Record<string, TokenMap> } {
  if (disabled.length === 0) return { axes, permutations, resolved };

  const disabledSet = new Set(disabled);
  const axisDefaults = new Map<string, string>();
  for (const axis of axes) axisDefaults.set(axis.name, axis.default);

  const filteredAxes = axes.filter((a) => !disabledSet.has(a.name));
  const filteredPermutations = permutations.filter((perm) => {
    for (const name of disabled) {
      if (perm.input[name] !== axisDefaults.get(name)) return false;
    }
    return true;
  });
  const surviving = new Set(filteredPermutations.map((p) => p.name));
  const filteredResolved: Record<string, TokenMap> = {};
  for (const [name, tokens] of Object.entries(resolved)) {
    if (surviving.has(name)) filteredResolved[name] = tokens;
  }
  return { axes: filteredAxes, permutations: filteredPermutations, resolved: filteredResolved };
}

/** Fetch the resolved tokens for a named permutation. Throws if the name is unknown. */
export function resolvePermutation(project: Project, name: string): ResolvedPermutation {
  const tokens = project.permutationsResolved[name];
  if (!tokens) {
    const known = project.permutations.map((p) => p.name).join(', ');
    throw new Error(`swatchbook: unknown permutation "${name}". Known: ${known || '(none)'}`);
  }
  return { name, tokens };
}
