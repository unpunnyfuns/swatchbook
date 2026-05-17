import { buildCells } from '#/cells.ts';
import { validateChrome } from '#/chrome.ts';
import { BufferedLogger, toDiagnostics } from '#/diagnostics.ts';
import { validateDisabledAxes } from '#/disabled-axes.ts';
import { probeJointOverrides } from '#/joint-overrides.ts';
import { fillPresetTuple, validatePresets } from '#/presets.ts';
import { validateCssOptions } from '#/terrazzo-options.ts';
import { resolveDefaultTuple } from '#/permutations/default.ts';
import { normalizePermutations } from '#/permutations/normalize.ts';
import { buildResolveAt } from '#/resolve-at.ts';
import { computeTokenListing } from '#/token-listing.ts';
import { buildVarianceByPath } from '#/variance-by-path.ts';
import {
  permutationID,
  type Axis,
  type Config,
  type Diagnostic,
  type Permutation,
  type Project,
  type TokenMap,
} from '#/types.ts';

/**
 * Load a swatchbook project from a config. Read tokens at any axis
 * tuple via `project.resolveAt(tuple)`; read the default-tuple
 * snapshot directly via `project.defaultTokens`. The bounded
 * primitives (`cells`, `jointOverrides`, `varianceByPath`) are
 * pre-computed at load time so downstream consumers don't pay
 * resolver costs.
 *
 * The `cwd` defaults to `process.cwd()`. All relative paths in
 * `config` (token globs, `resolver`, layered axis overlay globs)
 * resolve against this directory.
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
  // `project.defaultTokens` is the resolved TokenMap at the
  // user-specified default tuple. Singleton enumeration always
  // materializes the axes-defaults tuple; if `config.default` points
  // somewhere else, resolve it on the side.
  const computedDefault = permutationID(defaultTuple);
  const defaultTokens: TokenMap =
    filteredResolved[computedDefault] ??
    (normalized.parserInput?.resolver
      ? normalized.parserInput.resolver.apply(defaultTuple)
      : (filteredResolved[filteredPermutations[0]?.name ?? ''] ?? {}));

  const { presets, diagnostics: presetDiagnostics } = validatePresets(config.presets, filteredAxes);

  // Materialize any preset tuples the singleton enumeration didn't
  // cover. Singletons only vary one axis at a time, so any preset
  // pointing at a multi-non-default tuple needs an extra
  // `resolver.apply` call to ship the toolbar pill's resolved data.
  // Resolver-backed projects only — layered presets without a
  // resolver can't apply() on demand.
  if (normalized.parserInput?.resolver && presets.length > 0) {
    for (const preset of presets) {
      const tuple = fillPresetTuple(preset.axes, filteredAxes);
      const id = permutationID(tuple);
      if (filteredResolved[id]) continue;
      filteredResolved[id] = normalized.parserInput.resolver.apply(tuple);
      filteredPermutations.push({ name: id, input: tuple, sources: [] });
    }
  }

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

  // `defaultTuple` here is the post-disabledAxes-filter version,
  // matching what `cells` is keyed against.
  const projectDefaultTuple: Record<string, string> = {};
  for (const axis of filteredAxes) projectDefaultTuple[axis.name] = axis.default;

  // `buildCells` calls `resolveTuple` once per `(axis, context)`
  // singleton. Resolver-backed projects route through `resolver.apply`
  // directly (no scan of the singleton-enumeration shape); layered /
  // plain-parse projects look up the loader's per-tuple parse output
  // by `permutationID(tuple)`. Either way the data source is
  // upstream of `Project.permutations` / `permutationsResolved`.
  const resolveTuple = normalized.parserInput?.resolver
    ? (tuple: Readonly<Record<string, string>>): TokenMap =>
        normalized.parserInput!.resolver!.apply(tuple as Record<string, string>)
    : (tuple: Readonly<Record<string, string>>): TokenMap =>
        filteredResolved[permutationID(tuple)] ?? {};
  const cells = buildCells(filteredAxes, resolveTuple, projectDefaultTuple);

  // Pair-only joint-divergence probe via `resolver.apply` — bounded
  // by `Σ pairs (contexts_a - 1) × (contexts_b - 1)` calls,
  // independent of the cartesian product size. Returns two derived
  // signals: `overrides` for resolveAt correctness, `jointTouching`
  // for variance display (axes that genuinely contribute to a joint
  // divergence on a path, separated from cell-composition artifacts).
  const { overrides: jointOverrides, jointTouching } = probeJointOverrides(
    filteredAxes,
    cells,
    projectDefaultTuple,
    normalized.parserInput?.resolver,
  );
  const resolveAt = buildResolveAt(filteredAxes, cells, jointOverrides, projectDefaultTuple);

  // Pre-compute per-path variance from cells + jointOverrides — the
  // bounded surface, no cartesian dependency.
  const baselineForVariance = filteredAxes[0]
    ? (cells[filteredAxes[0].name]?.[filteredAxes[0].default] ?? {})
    : defaultTokens;
  const varianceByPath = buildVarianceByPath(
    filteredAxes,
    cells,
    jointTouching,
    baselineForVariance,
  );

  // `validateChrome` checks targets against the project's path
  // universe. `varianceByPath.keys()` is the union of every path
  // that appears in any theme by construction — same set the prior
  // `permutationsResolved`-scan produced, computed once at load time.
  const tokenIDs = new Set<string>(varianceByPath.keys());
  const { entries: chrome, diagnostics: chromeDiagnostics } = validateChrome(
    config.chrome,
    tokenIDs,
  );

  return {
    config: configWithDefaults,
    axes: filteredAxes,
    disabledAxes,
    presets,
    chrome,
    defaultTokens,
    cells,
    jointOverrides,
    defaultTuple: projectDefaultTuple,
    resolveAt,
    varianceByPath,
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
