import type { TokenNormalized } from '@terrazzo/parser';
import { generateShorthand, makeCSSVar, transformCSSValue } from '@terrazzo/token-tools/css';
import { CHROME_ROLES, CHROME_VAR_PREFIX, DEFAULT_CHROME_MAP } from '#/chrome.ts';
import { dataAttr } from '#/css.ts';
import type { Axis, Permutation, TokenMap } from '#/types.ts';

/** @internal Options for the axis-projected CSS emitter. Not part of the public API. */
export interface EmitAxisProjectedCssOptions {
  /** Override the prefix from project config (default: `config.cssVarPrefix ?? ''`). */
  prefix?: string;
  /**
   * Project axes. Each non-default `(axis, context)` cell emits a
   * single-attribute selector — `[data-<prefix>-<axis>="<context>"]` —
   * containing only the token declarations whose values differ from
   * the baseline (default-tuple) values. Cells from different axes
   * compose at runtime via the browser's CSS cascade.
   */
  axes?: Axis[];
  /**
   * Validated chrome-alias entries from `Project.chrome`. Each `source →
   * target` pair appends `--<prefix>-<source>: var(--<prefix>-<target>);`
   * to a trailing `:root` block. See `validateChrome`.
   */
  chrome?: Record<string, string>;
}

/**
 * Emit a single concatenated stylesheet as a **size optimization** for
 * resolver projects whose modifiers are orthogonal: one `:root` block
 * for the default tuple plus one `[data-<prefix>-<axis>="<context>"] { … }`
 * block per `(axis, non-default context)` cell, containing only the
 * declarations whose values differ from baseline at that cell.
 *
 * Output size scales with `Σ(axes × non-default contexts × varying
 * tokens)` instead of the cartesian product. Cells from different axes
 * compose at runtime via the browser's CSS cascade.
 *
 * ## When this is spec-faithful
 *
 * `emitCss` (the cartesian emitter) is what faithfully serializes the
 * resolved tokens for any DTCG-compliant resolver — including ones with
 * non-orthogonal modifiers. The DTCG Resolver Module 2025.10 (Final
 * Community Group Report) explicitly permits non-orthogonal modifiers
 * and resolves their conflicts via the `resolutionOrder` array
 * (last write wins). GitHub Primer's "Pirate" theme, available only in
 * light mode, is the rationale doc's canonical example — the spec
 * endorses authoring of that shape.
 *
 * This emitter, by contrast, is a **lossy size optimization** that
 * works correctly **only when modifiers are orthogonal** — i.e., when
 * the resolved value of any token at any tuple is fully determined by
 * stacking each axis's singleton effect, independent of the others.
 * Joint-variant tokens (values that genuinely depend on the
 * *combination* of two axes — e.g. an alias whose resolution differs
 * per `(brand, mode)` pair beyond what either singleton override
 * produces) will render the projection-implied value at runtime, not
 * the spec-correct joint resolution.
 *
 * **Use this emitter when** you've confirmed your modifiers are
 * orthogonal and want the size reduction. **Use `emitCss` when** any
 * modifier joint-varies tokens, or when in doubt — cartesian is the
 * spec-faithful default.
 *
 * A planned smart emitter folds projection + cartesian-fallback into
 * one path (orthogonal tokens projected, joint-variant tokens emitted
 * via compound selectors); once that ships this function may become
 * its internal primitive rather than a standalone consumer surface.
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
  permutations: Permutation[],
  permutationsResolved: Record<string, TokenMap>,
  options: EmitAxisProjectedCssOptions = {},
): string {
  const prefix = options.prefix ?? '';
  const varOpts = prefix ? { prefix } : {};
  const transformAlias = (token: TokenNormalized): string =>
    makeCSSVar(token.id, { ...varOpts, wrapVar: true });

  const axes = options.axes ?? [];
  const defaultTuple = buildDefaultTuple(axes);
  const baselinePerm =
    axes.length > 0 ? findPermutationByTuple(permutations, defaultTuple) : permutations[0];

  const blocks: string[] = [];
  const baselineDecls = new Map<string, string>();

  // 1. Baseline `:root` — every declaration the default tuple produces.
  if (baselinePerm) {
    const baselineTokens = permutationsResolved[baselinePerm.name];
    if (baselineTokens) {
      const lines: string[] = [];
      for (const decl of collectDeclarations(
        baselineTokens,
        baselinePerm.input,
        varOpts,
        transformAlias,
      )) {
        baselineDecls.set(decl.varName, decl.value);
        lines.push(`  ${decl.varName}: ${decl.value};`);
      }
      if (lines.length > 0) blocks.push(`:root {\n${lines.join('\n')}\n}`);
    }
  }

  // 2. Per `(axis, context)` cells — emit deltas only.
  for (const axis of axes) {
    for (const ctx of axis.contexts) {
      if (ctx === axis.default) continue;
      const cellTuple = { ...defaultTuple, [axis.name]: ctx };
      const cellPerm = findPermutationByTuple(permutations, cellTuple);
      if (!cellPerm) continue;
      const cellTokens = permutationsResolved[cellPerm.name];
      if (!cellTokens) continue;
      const deltaLines: string[] = [];
      for (const decl of collectDeclarations(cellTokens, cellPerm.input, varOpts, transformAlias)) {
        if (baselineDecls.get(decl.varName) === decl.value) continue;
        deltaLines.push(`  ${decl.varName}: ${decl.value};`);
      }
      if (deltaLines.length === 0) continue;
      const selector = `[${dataAttr(prefix, axis.name)}="${cssEscape(ctx)}"]`;
      blocks.push(`${selector} {\n${deltaLines.join('\n')}\n}`);
    }
  }

  // 3. Chrome aliases — trailing `:root` block, identical to `emitCss`.
  const chrome = options.chrome ?? {};
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
 * Stream of CSS declarations for a token map: one entry per emitted
 * `--var: value;` pair. Composite tokens emit one entry per sub-field
 * plus an optional shorthand entry — same expansion `emitCss` uses,
 * just yielded as `{ varName, value }` records so the delta-comparison
 * stage can dedupe against baseline without re-parsing the line.
 */
function* collectDeclarations(
  tokens: TokenMap,
  permutation: Record<string, string>,
  varOpts: VarOpts,
  transformAlias: (token: TokenNormalized) => string,
): Generator<{ varName: string; value: string }> {
  for (const [localID, token] of Object.entries(tokens)) {
    const varName = makeCSSVar(localID, varOpts);
    const value = transformCSSValue(token, { tokensSet: tokens, permutation, transformAlias });
    if (typeof value === 'string') {
      yield { varName, value };
      continue;
    }
    for (const [subKey, subVal] of Object.entries(value)) {
      const subName = makeCSSVar(`${localID}.${subKey}`, varOpts);
      yield { varName: subName, value: subVal };
    }
    const shorthand = generateShorthand({ token, localID });
    if (shorthand) yield { varName, value: shorthand };
  }
}

function buildDefaultTuple(axes: Axis[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const axis of axes) out[axis.name] = axis.default;
  return out;
}

function findPermutationByTuple(
  permutations: Permutation[],
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
