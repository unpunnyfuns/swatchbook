import type { TokenNormalized } from '@terrazzo/parser';
import { generateShorthand, makeCSSVar, transformCSSValue } from '@terrazzo/token-tools/css';
import { CHROME_ROLES, CHROME_VAR_PREFIX, DEFAULT_CHROME_MAP } from '#/chrome.ts';
import { cssEscape } from '#/css-escape.ts';
import { dataAttr } from '#/data-attr.ts';
import { resolveAliasAllAt, resolveAllAt } from '#/token-graph/walk.ts';
import type { Project, TokenMap } from '#/types.ts';
import { analyzeProjectVariance } from '#/variance-analysis.ts';
import type { VarianceInfo } from '#/variance-analysis.ts';
import { valueKey } from '#/value-key.ts';

/**
 * Internal alias: the raw Terrazzo-shape map this emitter passes into
 * `transformCSSValue` / `generateShorthand`. The public `TokenMap` is a
 * structural subset (`SwatchbookToken`) of `TokenNormalized` — every
 * value in any `TokenMap` here actually carries the full Terrazzo
 * fields, because it came from `resolver.apply()` and was stored
 * verbatim by the graph. The cast at the boundary (`asRawTokens`) is
 * safe by construction.
 */
type RawTokenMap = Record<string, TokenNormalized>;

function asRawTokens(map: TokenMap): RawTokenMap {
  return map as RawTokenMap;
}

/** @internal Addon-internal smart-emitter options. Not part of the public API. */
export interface EmitAxisProjectedCssOptions {
  /** Override the prefix from project config (default: `project.config.cssVarPrefix ?? ''`). */
  prefix?: string;
  /**
   * Validated chrome-alias entries from `Project.chrome`. Each `source →
   * target` pair appends `--<prefix>-<source>: var(--<prefix>-<target>);`
   * to a trailing `:root` block. Defaults to `project.chrome`. See
   * `validateChrome`.
   */
  chrome?: Record<string, string>;
  /**
   * Pre-computed variance analysis. When omitted, the emitter calls
   * `analyzeProjectVariance(project)` itself. Callers that need the
   * analysis for other purposes (diagnostics, alternative emit paths)
   * can compute it once and pass it here to avoid duplicate work.
   */
  variance?: Map<string, VarianceInfo>;
}

/**
 * Emit a single concatenated stylesheet by routing each token to the
 * cheapest emit strategy that still produces the spec-correct value
 * at every tuple. Spec-faithful for any DTCG-compliant resolver
 * (orthogonal or not):
 *
 * - **Baseline-only tokens** — emitted once in `:root`, never in any cell
 * - **Single-axis tokens** — emitted in `:root` plus the touching axis's
 *   cell blocks (standard projection: `[data-<prefix>-<axis>="<ctx>"]`)
 * - **Orthogonal-after-probe tokens** (touched by 2+ axes but
 *   cell-composition matches cartesian) — emitted in `:root` plus
 *   every touching axis's cell blocks; CSS cascade resolves the
 *   correct value at any tuple
 * - **Joint-variant tokens** (cell composition diverges from cartesian
 *   at some joint tuple) — emitted in `:root` plus per-axis cell blocks
 *   AS WELL AS compound `[data-A="ctx_a"][data-B="ctx_b"]` blocks
 *   carrying the cartesian-correct value at exactly the divergent
 *   joint tuples. Compound selector specificity `(0,2,0)` beats the
 *   singletons' `(0,1,0)`, so the joint cell wins under cascade.
 *
 * Smart dedup: every cell re-emits a token's value when ANY axis touches
 * the token (not just when this cell differs from baseline). For
 * orthogonal-after-probe tokens this means the last touching axis's
 * cell wins under cascade — which matches what `analyzeProjectVariance`
 * already verified for the `orthogonal-after-probe` classification.
 *
 * The classification work is the value-comparison + targeted-joint-probe
 * pass in `analyzeProjectVariance`. The emitter consumes that analysis
 * and does no spec reasoning of its own — every routing decision is
 * already in the `VarianceInfo` for the token.
 *
 * Output size scales with `baseline + per-axis cells + joint compound
 * blocks`. For mostly-orthogonal fixtures, dramatically smaller than
 * cartesian. In the worst case (every token touched by every axis with
 * joint variance on every pair), output approaches cartesian but never
 * exceeds it.
 *
 * For single-axis projects (a synthetic `theme` axis, or a resolver
 * with one modifier), the cell selector uses the axis's actual name
 * — e.g. `[data-mode="Dark"]`.
 *
 * @internal Consumers should not depend on this function directly.
 * External consumers driving their own build pipeline should use
 * Terrazzo's CLI against the DTCG sources directly.
 */
export function emitAxisProjectedCss(
  project: Project,
  options: EmitAxisProjectedCssOptions = {},
): string {
  const prefix = options.prefix ?? project.config.cssVarPrefix ?? '';
  const varOpts: VarOpts = prefix ? { prefix } : {};
  const transformAlias = (token: TokenNormalized): string =>
    makeCSSVar(token.id, { ...varOpts, wrapVar: true });

  const { axes, tokenGraph } = project;
  const variance = options.variance ?? analyzeProjectVariance(project);

  const defaultTuple = project.defaultTuple;
  // Baseline map from tokenGraph for value-comparison (delta detection).
  // resolveAliasAllAt preserves alias tokens in the Terrazzo-native shape
  // transformCSSValue requires.
  const baselineValues = resolveAllAt(tokenGraph, defaultTuple);
  const baselineTokens = resolveAliasAllAt(tokenGraph, defaultTuple);

  const blocks: string[] = [];

  // 1. Baseline `:root` — every token's baseline value lives here.
  //    Baseline-only tokens never appear elsewhere; all other variance
  //    kinds also need a baseline value to start the cascade from.
  {
    const baselineRaw = asRawTokens(baselineTokens);
    const lines = collectLines(
      baselineRaw,
      baselineRaw,
      () => true,
      defaultTuple,
      varOpts,
      transformAlias,
    );
    if (lines.length > 0) blocks.push(`:root {\n${lines.join('\n')}\n}`);
  }

  // Pre-compute per-axis delta sets using tokenGraph walks. A path is
  // in a delta cell when its resolved value at that singleton tuple
  // differs from the baseline — mirrors the shape buildCells produced.
  const deltaPathsByAxis: Record<string, Record<string, Set<string>>> = {};
  for (const axis of axes) {
    const axisDeltaPaths: Record<string, Set<string>> = {};
    for (const ctx of axis.contexts) {
      if (ctx === axis.default) continue;
      const cellTuple = { ...defaultTuple, [axis.name]: ctx };
      const cellValues = resolveAllAt(tokenGraph, cellTuple);
      const delta = new Set<string>();
      for (const [path, token] of Object.entries(cellValues)) {
        if (valueKey(token) !== valueKey(baselineValues[path])) delta.add(path);
      }
      axisDeltaPaths[ctx] = delta;
    }
    deltaPathsByAxis[axis.name] = axisDeltaPaths;
  }

  // 2. Per-axis singleton cells — emit every token this axis touches.
  //    Under smart dedup we don't drop "matches baseline" values; the
  //    cascade needs them to win against other axes that might have
  //    overridden the var. Variance routing makes "touches" precise:
  //    only tokens where `axesTouching(token)` includes this axis emit
  //    here. Baseline-only tokens are filtered out entirely.
  for (const axis of axes) {
    for (const ctx of axis.contexts) {
      if (ctx === axis.default) continue;
      const cellTuple = { ...defaultTuple, [axis.name]: ctx };
      const cellTokens = resolveAliasAllAt(tokenGraph, cellTuple);
      const cellTokensForAliases = cellTokens;
      const deltaPaths = deltaPathsByAxis[axis.name]?.[ctx] ?? new Set<string>();

      const lines = collectLines(
        asRawTokens(cellTokens),
        asRawTokens(cellTokensForAliases),
        (path) => deltaPaths.has(path) && axisTouchesToken(axis.name, variance.get(path)),
        cellTuple,
        varOpts,
        transformAlias,
      );
      if (lines.length === 0) continue;
      const selector = `[${dataAttr(prefix, axis.name)}="${cssEscape(ctx)}"]`;
      blocks.push(`${selector} {\n${lines.join('\n')}\n}`);
    }
  }

  // 3. Compound joint cells — walk axis combos (arity 2..axes.length)
  //    in the same order probeJointOverrides used, compare tokenGraph
  //    cartesian truth against projection composition, and emit blocks
  //    for divergent tuples. resolveAliasAllAt provides alias-preserving
  //    token shapes for transformCSSValue.
  for (const block of collectJointBlocks(
    project,
    baselineValues,
    deltaPathsByAxis,
    prefix,
    varOpts,
    transformAlias,
  )) {
    blocks.push(block);
  }

  // 4. Chrome aliases — trailing `:root` block.
  const chrome = options.chrome ?? project.chrome;
  const chromeLines: string[] = ['  color-scheme: light dark;'];
  for (const role of CHROME_ROLES) {
    const sourceVar = makeCSSVar(role, { prefix: CHROME_VAR_PREFIX });
    const target = chrome[role];
    if (target !== undefined) {
      const targetVar = makeCSSVar(target, { ...varOpts, wrapVar: true });
      chromeLines.push(`  ${sourceVar}: ${targetVar};`);
    } else {
      chromeLines.push(`  ${sourceVar}: ${DEFAULT_CHROME_MAP[role]};`);
    }
  }
  blocks.push(`:root {\n${chromeLines.join('\n')}\n}`);

  return `${blocks.join('\n\n')}\n`;
}

type VarOpts = Record<string, never> | { prefix: string };

/**
 * Tells whether the given axis is in a token's touching set. Drives the
 * per-axis cell-block filter: only tokens this axis actually affects
 * appear in that axis's cell blocks.
 */
function axisTouchesToken(axisName: string, info: VarianceInfo | undefined): boolean {
  if (!info) return false;
  switch (info.kind) {
    case 'baseline-only':
      return false;
    case 'single-axis':
      return info.axis === axisName;
    case 'orthogonal-after-probe':
    case 'joint-variant':
      return info.touching.has(axisName);
    default: {
      const exhaustive: never = info;
      throw new Error(`unhandled VarianceInfo kind: ${JSON.stringify(exhaustive)}`);
    }
  }
}

interface Axis {
  name: string;
  contexts: readonly string[];
  default: string;
}

/**
 * Walk all axis combos of arity 2..axes.length in the same order
 * probeJointOverrides used. For each partial tuple, compare the
 * tokenGraph's cartesian truth against projection composition — which
 * mirrors what CSS cascade actually produces given the emitted blocks.
 *
 * CSS cascade at a triple selector applies after all pairs, so the
 * composition at arity N must include the already-accumulated arity-(N-1)
 * corrections. This matches what probeJointOverrides did by passing
 * accumulated overrides into its composer at each arity level.
 *
 * divergence detection uses valueKey comparisons on graph-walked values.
 * CSS generation uses resolveAliasAllAt for alias-preserving tokens.
 */
function collectJointBlocks(
  project: Project,
  baselineValues: TokenMap,
  deltaPathsByAxis: Record<string, Record<string, Set<string>>>,
  prefix: string,
  varOpts: VarOpts,
  transformAlias: (token: TokenNormalized) => string,
): string[] {
  const { axes, tokenGraph, defaultTuple } = project;
  if (axes.length < 2) return [];

  const blocks: string[] = [];

  // Accumulated lower-arity joint corrections, keyed by canonical partial
  // tuple (sorted axis entries joined as "axis=ctx|axis=ctx"). Used by
  // higher-arity composition to include corrections from pairs before
  // computing triple divergences — same as probeJointOverrides' composer.
  const accumulatedCorrections = new Map<string, Map<string, TokenMap>>();

  for (let arity = 2; arity <= axes.length; arity++) {
    for (const axisCombo of axisCombinations(axes, arity)) {
      for (const partialTuple of contextProducts(axisCombo)) {
        const fullTuple = { ...defaultTuple, ...partialTuple };
        const cartesian = resolveAllAt(tokenGraph, fullTuple);

        // Build projection composition: baseline values + per-axis delta
        // layers + all lower-arity joint corrections that apply to this
        // fullTuple, in ascending arity order. This mirrors CSS cascade.
        const composed: TokenMap = { ...baselineValues };
        for (const axis of axes) {
          const ctx = fullTuple[axis.name];
          if (ctx === undefined || ctx === axis.default) continue;
          const deltaPaths = deltaPathsByAxis[axis.name]?.[ctx];
          if (!deltaPaths) continue;
          const cellValues = resolveAllAt(tokenGraph, { ...defaultTuple, [axis.name]: ctx });
          for (const path of deltaPaths) {
            const tok = cellValues[path];
            if (tok !== undefined) composed[path] = tok;
          }
        }
        // Apply lower-arity accumulated corrections. Iterate arity 2..(arity-1)
        // so higher-order corrections subsume lower ones in the right order.
        for (let lowerArity = 2; lowerArity < arity; lowerArity++) {
          const byArity = accumulatedCorrections.get(String(lowerArity));
          if (!byArity) continue;
          for (const [correctionKey, correctionValues] of byArity) {
            // A lower-arity correction applies when every axis=ctx in its key
            // matches the fullTuple. Parse the correction key back out.
            if (!correctionKeyIsSubset(correctionKey, fullTuple)) continue;
            for (const [path, tok] of Object.entries(correctionValues)) {
              composed[path] = tok;
            }
          }
        }

        // Collect divergent paths (cartesian ≠ projection after corrections).
        const divergentPaths: string[] = [];
        const divergentValues: TokenMap = {};
        for (const path of Object.keys(cartesian)) {
          if (valueKey(cartesian[path]) !== valueKey(composed[path])) {
            divergentPaths.push(path);
            divergentValues[path] = cartesian[path]!;
          }
        }

        // Record this arity's corrections for use by higher arities.
        if (divergentPaths.length > 0) {
          const corrKey = canonicalPartialKey(partialTuple);
          let byArity = accumulatedCorrections.get(String(arity));
          if (!byArity) {
            byArity = new Map<string, TokenMap>();
            accumulatedCorrections.set(String(arity), byArity);
          }
          byArity.set(corrKey, divergentValues);
        }

        if (divergentPaths.length === 0) continue;

        // CSS generation — resolveAliasAllAt preserves alias token shapes
        // that transformCSSValue requires.
        const fullTokens = asRawTokens(resolveAliasAllAt(tokenGraph, fullTuple));
        const axisEntries = Object.entries(partialTuple);
        const selector = axisEntries
          .map(([axisName, ctx]) => `[${dataAttr(prefix, axisName)}="${cssEscape(ctx)}"]`)
          .join('');

        const lines: string[] = [];
        for (const path of divergentPaths) {
          const token = fullTokens[path];
          if (!token) continue;
          for (const decl of collectTokenDeclarations(
            path,
            token,
            fullTokens,
            fullTuple,
            varOpts,
            transformAlias,
          )) {
            lines.push(`  ${decl.varName}: ${decl.value};`);
          }
        }
        if (lines.length > 0) blocks.push(`${selector} {\n${lines.join('\n')}\n}`);
      }
    }
  }

  return blocks;
}

/**
 * Build a stable lookup key for a partial tuple — axis entries joined
 * in sorted key order so `{A: a, B: b}` and `{B: b, A: a}` match.
 */
function canonicalPartialKey(partial: Record<string, string>): string {
  return Object.entries(partial)
    .toSorted(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('|');
}

/**
 * Check whether a canonicalPartialKey string is a subset of a fullTuple.
 * `"mode=Dark|brand=Brand A"` is a subset of `{mode: 'Dark', brand: 'Brand A', contrast: 'High'}`.
 */
function correctionKeyIsSubset(corrKey: string, fullTuple: Record<string, string>): boolean {
  const parts = corrKey.split('|');
  for (const part of parts) {
    const eq = part.indexOf('=');
    if (eq < 0) return false;
    const axis = part.slice(0, eq);
    const ctx = part.slice(eq + 1);
    if (fullTuple[axis] !== ctx) return false;
  }
  return true;
}

/**
 * Collect emitted declaration lines for a token map, filtering tokens
 * by `accept(path)`. Each line is `  --var: value;` (with leading
 * indent for embedding in a block). Composite tokens contribute one
 * line per sub-field plus an optional shorthand line; primitives
 * contribute one line.
 *
 * `tokensForAliasResolution` is the broader resolution context —
 * with delta cells, `tokens` itself only carries the delta paths,
 * so composite token sub-aliases need the full composed TokenMap
 * to resolve references to non-delta tokens.
 */
function collectLines(
  tokens: RawTokenMap,
  tokensForAliasResolution: RawTokenMap,
  accept: (path: string) => boolean,
  permutation: Record<string, string>,
  varOpts: VarOpts,
  transformAlias: (token: TokenNormalized) => string,
): string[] {
  const lines: string[] = [];
  for (const [path, token] of Object.entries(tokens)) {
    if (!accept(path)) continue;
    for (const decl of collectTokenDeclarations(
      path,
      token,
      tokensForAliasResolution,
      permutation,
      varOpts,
      transformAlias,
    )) {
      lines.push(`  ${decl.varName}: ${decl.value};`);
    }
  }
  return lines;
}

/**
 * Expand a single token into its emitted `{ varName, value }` records.
 * Primitive tokens yield one record; composite tokens yield one per
 * sub-field plus an optional shorthand.
 */
function* collectTokenDeclarations(
  localID: string,
  token: TokenNormalized,
  tokensSet: RawTokenMap,
  permutation: Record<string, string>,
  varOpts: VarOpts,
  transformAlias: (token: TokenNormalized) => string,
): Generator<{ varName: string; value: string }> {
  const varName = makeCSSVar(localID, varOpts);
  const value = transformCSSValue(token, { tokensSet, permutation, transformAlias });
  if (typeof value === 'string') {
    yield { varName, value };
    return;
  }
  for (const [subKey, subVal] of Object.entries(value)) {
    yield { varName: makeCSSVar(`${localID}.${subKey}`, varOpts), value: subVal };
  }
  const shorthand = generateShorthand({ token, localID });
  if (shorthand) yield { varName, value: shorthand };
}

function* axisCombinations(axes: readonly Axis[], k: number): Generator<readonly Axis[]> {
  if (k === 0) {
    yield [];
    return;
  }
  if (k > axes.length) return;
  for (let i = 0; i <= axes.length - k; i++) {
    const head = axes[i] as Axis;
    for (const tail of axisCombinations(axes.slice(i + 1), k - 1)) {
      yield [head, ...tail];
    }
  }
}

function* contextProducts(axisCombo: readonly Axis[]): Generator<Record<string, string>> {
  if (axisCombo.length === 0) {
    yield {};
    return;
  }
  const [first, ...rest] = axisCombo;
  if (!first) return;
  for (const ctx of first.contexts) {
    if (ctx === first.default) continue;
    for (const subTuple of contextProducts(rest)) {
      yield { [first.name]: ctx, ...subTuple };
    }
  }
}
