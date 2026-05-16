import type { TokenNormalized } from '@terrazzo/parser';
import { generateShorthand, makeCSSVar, transformCSSValue } from '@terrazzo/token-tools/css';
import { CHROME_ROLES, CHROME_VAR_PREFIX, DEFAULT_CHROME_MAP } from '#/chrome.ts';
import { dataAttr } from '#/css.ts';
import type { Axis, Permutation, Project, TokenMap } from '#/types.ts';
import { analyzeProjectVariance, type JointCase, type VarianceInfo } from '#/variance-analysis.ts';

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
 * — e.g. `[data-mode="Dark"]` — rather than the `theme` alias that
 * `emitCss` uses. Both forms are scope-equivalent on `<html>`.
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

  const { axes, permutations, permutationsResolved } = project;
  const variance = options.variance ?? analyzeProjectVariance(project);

  const defaultTuple = buildDefaultTuple(axes);
  const baselinePerm =
    axes.length > 0 ? findPermutationByTuple(permutations, defaultTuple) : permutations[0];

  const blocks: string[] = [];

  // 1. Baseline `:root` — every token's baseline value lives here.
  //    Baseline-only tokens never appear elsewhere; all other variance
  //    kinds also need a baseline value to start the cascade from.
  if (baselinePerm) {
    const baselineTokens = permutationsResolved[baselinePerm.name];
    if (baselineTokens) {
      const lines = collectLines(
        baselineTokens,
        () => true,
        baselinePerm.input,
        varOpts,
        transformAlias,
      );
      if (lines.length > 0) blocks.push(`:root {\n${lines.join('\n')}\n}`);
    }
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
      const cellPerm = findPermutationByTuple(permutations, cellTuple);
      if (!cellPerm) continue;
      const cellTokens = permutationsResolved[cellPerm.name];
      if (!cellTokens) continue;

      const lines = collectLines(
        cellTokens,
        (path) => axisTouchesToken(axis.name, variance.get(path)),
        cellPerm.input,
        varOpts,
        transformAlias,
      );
      if (lines.length === 0) continue;
      const selector = `[${dataAttr(prefix, axis.name)}="${cssEscape(ctx)}"]`;
      blocks.push(`${selector} {\n${lines.join('\n')}\n}`);
    }
  }

  // 3. Compound joint cells — one block per unique `(axisA, ctxA, axisB,
  //    ctxB)` combination across all joint-variant tokens. The block
  //    carries the spec-correct cartesian values for each token that
  //    diverges from projection composition at that joint tuple.
  //    Compound selector specificity beats the singleton cells, so the
  //    joint cell wins where it applies.
  for (const block of collectJointBlocks(
    variance,
    permutationsResolved,
    prefix,
    varOpts,
    transformAlias,
  )) {
    blocks.push(block);
  }

  // 4. Chrome aliases — trailing `:root` block, identical to `emitCss`.
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
  }
}

/**
 * Group every joint-variant token's `jointCases` by their compound
 * selector key (`axisA|ctxA|axisB|ctxB`), then emit one block per
 * unique key containing the cartesian-correct values for each token's
 * joint case. Each token's joint value is pulled from the corresponding
 * permutation's resolved TokenMap (the `permutationName` recorded
 * during analysis), so it goes through the same Terrazzo-side resolution
 * as cartesian emit would.
 */
function collectJointBlocks(
  variance: Map<string, VarianceInfo>,
  permutationsResolved: Record<string, TokenMap>,
  prefix: string,
  varOpts: VarOpts,
  transformAlias: (token: TokenNormalized) => string,
): string[] {
  const grouped = new Map<string, { path: string; jointCase: JointCase }[]>();
  for (const [path, info] of variance) {
    if (info.kind !== 'joint-variant') continue;
    for (const jointCase of info.jointCases) {
      const key = `${jointCase.axisA}|${jointCase.ctxA}|${jointCase.axisB}|${jointCase.ctxB}`;
      const bucket = grouped.get(key) ?? [];
      bucket.push({ path, jointCase });
      grouped.set(key, bucket);
    }
  }

  const blocks: string[] = [];
  for (const [key, entries] of grouped) {
    const parts = key.split('|');
    const axisA = parts[0] as string;
    const ctxA = parts[1] as string;
    const axisB = parts[2] as string;
    const ctxB = parts[3] as string;
    const selector = `[${dataAttr(prefix, axisA)}="${cssEscape(ctxA)}"][${dataAttr(prefix, axisB)}="${cssEscape(ctxB)}"]`;

    const lines: string[] = [];
    for (const { path, jointCase } of entries) {
      const cellTokens = permutationsResolved[jointCase.permutationName];
      if (!cellTokens) continue;
      const token = cellTokens[path];
      if (!token) continue;
      for (const decl of collectTokenDeclarations(
        path,
        token,
        cellTokens,
        // Use the joint permutation's input as the resolution context —
        // composite token sub-fields and alias references are resolved
        // against the joint tuple, matching what cartesian emit would do.
        jointInputFromCase(jointCase),
        varOpts,
        transformAlias,
      )) {
        lines.push(`  ${decl.varName}: ${decl.value};`);
      }
    }
    if (lines.length > 0) blocks.push(`${selector} {\n${lines.join('\n')}\n}`);
  }

  return blocks;
}

/**
 * Reconstruct a partial `permutation.input` from a JointCase. Used as
 * the `permutation` context for `transformCSSValue` — composite tokens
 * and aliases resolve against the joint tuple. Other axes default
 * naturally during transform; the joint axes are the load-bearing ones.
 */
function jointInputFromCase(jointCase: JointCase): Record<string, string> {
  return { [jointCase.axisA]: jointCase.ctxA, [jointCase.axisB]: jointCase.ctxB };
}

/**
 * Collect emitted declaration lines for a token map, filtering tokens
 * by `accept(path)`. Each line is `  --var: value;` (with leading
 * indent for embedding in a block). Composite tokens contribute one
 * line per sub-field plus an optional shorthand line; primitives
 * contribute one line.
 */
function collectLines(
  tokens: TokenMap,
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
      tokens,
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
 * sub-field plus an optional shorthand. Mirrors `emitCss`'s expansion
 * — kept here so the two emitters produce byte-identical declarations
 * for the tokens they each emit.
 */
function* collectTokenDeclarations(
  localID: string,
  token: TokenNormalized,
  tokensSet: TokenMap,
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

function buildDefaultTuple(axes: readonly Axis[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const axis of axes) out[axis.name] = axis.default;
  return out;
}

function findPermutationByTuple(
  permutations: readonly Permutation[],
  tuple: Readonly<Record<string, string>>,
): Permutation | undefined {
  const keys = Object.keys(tuple);
  return permutations.find((perm) => {
    for (const key of keys) {
      if (perm.input[key] !== tuple[key]) return false;
    }
    return Object.keys(perm.input).length === keys.length;
  });
}

function cssEscape(name: string): string {
  return name.replaceAll('\\', '\\\\').replaceAll('"', '\\"');
}
