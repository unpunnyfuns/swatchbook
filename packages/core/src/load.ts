import { validateChrome } from '#/chrome.ts';
import { BufferedLogger, toDiagnostics } from '#/diagnostics.ts';
import { validateDisabledAxes } from '#/disabled-axes.ts';
import { fillPresetTuple, validatePresets } from '#/presets.ts';
import { validateCssOptions } from '#/terrazzo-options.ts';
import { resolveDefaultTuple } from '#/permutations/default.ts';
import { normalizePermutations } from '#/permutations/normalize.ts';
import { computeTokenListing } from '#/token-listing.ts';
import { buildTokenGraph, buildTokenGraphFromLayered } from '#/token-graph/build.ts';
import type { BuildTokenGraphResult } from '#/token-graph/build.ts';
import { buildFailedDiagnostic } from '#/token-graph/diagnostics.ts';
import { listPaths } from '#/token-graph/queries.ts';
import { resolveAllAt } from '#/token-graph/walk.ts';
import { permutationID } from '#/types.ts';
import type { Axis, Config, Diagnostic, Permutation, Project, TokenMap } from '#/types.ts';

/**
 * Load a swatchbook project from a config. Read tokens at any axis
 * tuple via `project.resolveAt(tuple)`; read the default-tuple
 * snapshot directly via `project.defaultTokens`.
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

/**
 * Opt-in phase timing for `loadProject`. Activate with the env var
 * `SWATCHBOOK_LOG_VERBOSE=1`. Each major phase logs its duration to
 * stdout as `[swatchbook:load] <phase>: <ms>ms`. When the env var is
 * unset, the overhead is a few `performance.now()` calls per phase
 * (negligible) and no console output.
 *
 * Primary use case: a consumer reports a hung or slow `loadProject` and
 * we need to know which phase is the offender before reaching for a
 * full CPU profile.
 */
function isVerbose(): boolean {
  return process.env['SWATCHBOOK_LOG_VERBOSE'] === '1';
}

function logPhase(label: string, startedAt: number): void {
  if (!isVerbose()) return;
  const ms = performance.now() - startedAt;
  // biome-ignore lint/suspicious/noConsole: opt-in debug output, gated behind env var
  console.log(`[swatchbook:load] ${label}: ${ms.toFixed(0)}ms`);
}

export async function loadProject(config: Config, cwd: string = process.cwd()): Promise<Project> {
  const loadStart = performance.now();
  const logger = new BufferedLogger({ level: 'warn' });
  const configWithDefaults: Config = {
    ...config,
    cssVarPrefix: config.cssVarPrefix ?? DEFAULT_CSS_VAR_PREFIX,
  };
  const tParse = performance.now();
  const normalized = await normalizePermutations(configWithDefaults, cwd, logger);
  logPhase('parse + normalize', tParse);

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
    const tPresets = performance.now();
    for (const preset of presets) {
      const tuple = fillPresetTuple(preset.axes, filteredAxes);
      const id = permutationID(tuple);
      if (filteredResolved[id]) continue;
      filteredResolved[id] = normalized.parserInput.resolver.apply(tuple);
      filteredPermutations.push({ name: id, input: tuple, sources: [] });
    }
    logPhase(`apply ${presets.length} preset tuple(s)`, tPresets);
  }

  const { diagnostics: cssOptionsDiagnostics } = validateCssOptions(config.cssOptions);

  const tListing = performance.now();
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
  logPhase('token-listing build', tListing);

  // `defaultTuple` here is the post-disabledAxes-filter version.
  const projectDefaultTuple: Record<string, string> = {};
  for (const axis of filteredAxes) projectDefaultTuple[axis.name] = axis.default;

  // Build the token graph. Resolver-backed projects build from the live
  // Resolver; layered / plain-parse projects infer writes by diffing
  // per-singleton resolved maps.
  const tGraph = performance.now();
  let tokenGraphResult: BuildTokenGraphResult;
  try {
    if (normalized.parserInput?.resolver) {
      tokenGraphResult = buildTokenGraph(normalized.parserInput, filteredAxes, projectDefaultTuple);
    } else {
      const baselineFromLayered =
        filteredResolved[permutationID(projectDefaultTuple)] ??
        filteredResolved[Object.values(filteredPermutations)[0]?.name ?? ''] ??
        {};
      tokenGraphResult = buildTokenGraphFromLayered(
        filteredAxes,
        baselineFromLayered,
        filteredResolved,
        projectDefaultTuple,
      );
    }
    logPhase('graph build', tGraph);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    tokenGraphResult = {
      graph: {
        nodes: {},
        axes: filteredAxes.map((a) => a.name),
        axisDefaults: projectDefaultTuple,
        axisContexts: Object.fromEntries(filteredAxes.map((a) => [a.name, a.contexts])),
      },
      diagnostics: [buildFailedDiagnostic(detail)] as readonly Diagnostic[],
    };
  }

  // resolveAt: graph-backed for all projects. Fills in axis defaults (so
  // partial tuples canonicalize to the same key as a fully-specified
  // equivalent) and memoizes by canonical key so repeated calls with the
  // same effective tuple return the same instance.
  const resolveAt = (() => {
    const memo = new Map<string, TokenMap>();
    return (tuple: Record<string, string>): TokenMap => {
      const full: Record<string, string> = { ...projectDefaultTuple };
      for (const axis of filteredAxes) {
        const val = tuple[axis.name];
        if (val !== undefined) full[axis.name] = val;
      }
      const key = filteredAxes.map((a) => `${a.name}=${full[a.name]}`).join('|');
      const cached = memo.get(key);
      if (cached) return cached;
      const result = resolveAllAt(tokenGraphResult.graph, full);
      memo.set(key, result);
      return result;
    };
  })();

  // `validateChrome` checks targets against the project's path universe.
  // `listPaths` returns every path present in the graph — same set the
  // prior `permutationsResolved`-scan produced.
  const tokenIDs = new Set<string>(listPaths(tokenGraphResult.graph));
  const { entries: chrome, diagnostics: chromeDiagnostics } = validateChrome(
    config.chrome,
    tokenIDs,
  );

  logPhase('total', loadStart);

  return {
    config: configWithDefaults,
    axes: filteredAxes,
    disabledAxes,
    presets,
    chrome,
    defaultTokens,
    defaultTuple: projectDefaultTuple,
    resolveAt,
    tokenGraph: tokenGraphResult.graph,
    sourceFiles: normalized.sourceFiles,
    cwd,
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
      ...tokenGraphResult.diagnostics,
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
  const canonicalised: Record<string, TokenMap> = {};
  for (const perm of filteredPermutations) {
    const tokens = resolved[perm.name];
    if (!tokens) continue;
    const filteredTuple: Record<string, string> = {};
    for (const axis of filteredAxes)
      filteredTuple[axis.name] = perm.input[axis.name] ?? axis.default;
    canonicalised[permutationID(filteredTuple)] = tokens;
  }
  // Re-key permutation names to match the canonicalised (filtered-axes-only) key shape.
  const rekeyed = filteredPermutations.map((perm) => {
    const filteredTuple: Record<string, string> = {};
    for (const axis of filteredAxes)
      filteredTuple[axis.name] = perm.input[axis.name] ?? axis.default;
    return { ...perm, name: permutationID(filteredTuple) };
  });
  return { axes: filteredAxes, permutations: rekeyed, resolved: canonicalised };
}
