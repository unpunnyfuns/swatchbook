import type { TokenNormalized } from '@terrazzo/parser';
import { permutationID, type Project, type TokenMap } from '#/types.ts';

/**
 * Per-token variance classification across a loaded project's axes.
 *
 * `analyzeProjectVariance` is the first half of swatchbook's smart-emitter
 * strategy: classify each token by how it varies across axes, then let
 * the emitter route per-token — orthogonal tokens via projection
 * (single-attribute selectors), joint-variant tokens via compound
 * selectors. This module does only the classification; the routing
 * emitter consumes the output.
 *
 * The algorithm runs in three phases:
 *
 * 1. **Per-axis cell read** — pull each non-default `(axis, context)`
 *    cell's resolved `TokenMap` from `project.permutationsResolved`.
 *    Free; the loader already paid this cost.
 * 2. **Touching set** — for each token, determine which axes can change
 *    its value at any tuple. Compares each singleton cell against the
 *    default cell; an axis whose non-default contexts produce a
 *    different value than the baseline touches the token. The naive
 *    "compare singleton cell to baseline"
 *    check would miss axes whose effect ONLY shows under specific
 *    joint combinations (e.g. brand's effect on `accent.fg` is hidden
 *    when mode is Light because Brand A's white matches baseline white;
 *    only when mode is Dark does brand's white actively differ from
 *    Dark's overridden value). Tokens touched by ≤1 axis can't be
 *    joint-variant by definition.
 * 3. **Targeted joint probe** — for tokens touched by 2+ axes, for each
 *    axis-pair `(A, B)` they're touched by, for each non-default
 *    combination `(ctx_a, ctx_b)`, compare the cartesian-resolved
 *    value (`resolver.apply({...defaults, A: ctx_a, B: ctx_b})[T]`)
 *    against the projection-composed value the browser cascade would
 *    produce given the per-axis cells. If they differ, the token is
 *    joint-variant on that pair at that combination.
 *
 * Triple-and-higher joint variance is not probed (rare in practice;
 * `$extensions` annotation is the future override).
 *
 * Layered and plain-parse projects don't have `project.parserInput.resolver`,
 * so Phase 3 is skipped — multi-touch tokens in those projects are
 * conservatively classified as `joint-variant` with empty `jointCases`.
 * The downstream emitter falls back to cartesian-style emit for them.
 */

/** Distinguishes a token's variance shape so the emitter can route it. */
export type VarianceInfo =
  | {
      /** Token has the same `$value` across every cell — lives in `:root` only. */
      kind: 'baseline-only';
    }
  | {
      /** Token varies only when the named axis flips — standard projection. */
      kind: 'single-axis';
      axis: string;
    }
  | {
      /**
       * Token varies across 2+ axes but no joint-pair probe found a divergence
       * from projection composition — emit as standard projection cells, the
       * cascade resolves correctly under smart dedup.
       */
      kind: 'orthogonal-after-probe';
      touching: ReadonlySet<string>;
    }
  | {
      /**
       * Token's value at some joint tuple cannot be reconstructed from
       * per-axis cell composition (alias-interpolation joint, or any case
       * where the resolver's joint resolution diverges from cascade).
       * The emitter must produce compound `[data-A][data-B]` selectors
       * for the listed `jointCases` to preserve the cartesian-correct
       * values.
       */
      kind: 'joint-variant';
      touching: ReadonlySet<string>;
      jointCases: readonly JointCase[];
    };

/** One concrete `(A=ctx_a, B=ctx_b)` combination where projection differs from cartesian. */
export interface JointCase {
  axisA: string;
  ctxA: string;
  axisB: string;
  ctxB: string;
  /**
   * Stringified `$value` from `resolver.apply` at the joint tuple — the
   * spec-correct value that compound-selector emit must reproduce. The
   * emitter looks up the full `TokenNormalized` from
   * `project.permutationsResolved[permutationName]` to access transform
   * data; this key is purely for comparison + diagnostics.
   */
  cartesianValueKey: string;
  /** Permutation name in `project.permutationsResolved` where the joint TokenMap lives. */
  permutationName: string;
}

/**
 * Classify every token in a project. Returns a Map keyed by token path
 * (the same paths that appear in `project.permutationsResolved[*]`).
 * Tokens that don't appear in any permutation are not in the map; the
 * emitter can iterate the map and project.graph in tandem if it needs a
 * stable union.
 */
export function analyzeProjectVariance(project: Project): Map<string, VarianceInfo> {
  const result = new Map<string, VarianceInfo>();
  const { axes } = project;

  if (axes.length === 0) {
    // No axes → every token is baseline-only. Skip the cell + probe work.
    for (const path of Object.keys(project.graph)) {
      result.set(path, { kind: 'baseline-only' });
    }
    return result;
  }

  // Phase 1 — locate the baseline tuple + per-axis non-default cells.
  // Reads directly from `project.cells` rather than reconstructing
  // from `permutationsResolved`. `Project.cells` is the bounded
  // per-axis surface; cartesian materialization is on its way out.
  const defaultTuple = project.defaultTuple;
  const firstAxis = axes[0];
  const baseline: TokenMap = firstAxis
    ? (project.cells[firstAxis.name]?.[firstAxis.default] ?? project.graph)
    : project.graph;

  const cells: Record<string, Record<string, TokenMap>> = {};
  for (const axis of axes) {
    const axisCells: Record<string, TokenMap> = {};
    for (const ctx of axis.contexts) {
      if (ctx === axis.default) continue;
      const cell = project.cells[axis.name]?.[ctx];
      if (cell) axisCells[ctx] = cell;
    }
    cells[axis.name] = axisCells;
  }

  // Phase 2 — touching set per token. Build the union of every token path
  // mentioned by baseline or any cell, then for each token find every axis
  // whose contexts produce different values when other axes are held
  // constant. This catches joint-only touching: an axis whose effect is
  // hidden when others sit at defaults but becomes load-bearing under
  // specific combinations (Brand A's `accent.fg = white` matches baseline
  // white, so its singleton cell looks like a no-op — but in combination
  // with Dark mode where the baseline value is overridden, Brand A's white
  // is genuinely an override).
  const allPaths = new Set<string>(Object.keys(baseline));
  for (const axisCells of Object.values(cells)) {
    for (const cell of Object.values(axisCells)) {
      for (const path of Object.keys(cell)) allPaths.add(path);
    }
  }

  // Use the project's cached per-path variance instead of re-running
  // the bucket analysis at every read.
  const touchingByPath = new Map<string, Set<string>>();
  for (const path of allPaths) {
    const cached = project.varianceByPath.get(path);
    touchingByPath.set(path, new Set(cached?.varyingAxes ?? []));
  }

  // Phase 3 — derive joint-variant kind from `project.jointOverrides`
  // instead of running an ad-hoc resolver probe. The overrides were
  // computed once at load time and carry the same divergence
  // information; reading from them avoids a duplicate probe pass on
  // every emit.
  const jointCasesByPath = new Map<string, JointCase[]>();
  for (const override of project.jointOverrides.values()) {
    const axisEntries = Object.entries(override.axes);
    if (axisEntries.length < 2) continue;
    // Flatten N-arity overrides into all pair sub-combinations so the
    // pair-shaped `JointCase` surface keeps working for consumers
    // that depend on it (analyzeProjectVariance tests + any external
    // tooling). The smart emitter itself iterates `jointOverrides`
    // at full arity for compound-block emission.
    for (let i = 0; i < axisEntries.length; i++) {
      for (let j = i + 1; j < axisEntries.length; j++) {
        const [axisA, ctxA] = axisEntries[i] as [string, string];
        const [axisB, ctxB] = axisEntries[j] as [string, string];
        for (const [path, token] of Object.entries(override.tokens)) {
          const list = jointCasesByPath.get(path) ?? [];
          const fullTuple = { ...defaultTuple, ...override.axes };
          list.push({
            axisA,
            ctxA,
            axisB,
            ctxB,
            cartesianValueKey: valueKey(token),
            permutationName: permutationID(fullTuple),
          });
          jointCasesByPath.set(path, list);
        }
      }
    }
  }

  for (const [path, touching] of touchingByPath) {
    if (touching.size === 0) {
      result.set(path, { kind: 'baseline-only' });
      continue;
    }
    if (touching.size === 1) {
      const [axis] = touching;
      result.set(path, { kind: 'single-axis', axis: axis as string });
      continue;
    }
    const jointCases = jointCasesByPath.get(path) ?? [];
    if (jointCases.length === 0) {
      result.set(path, { kind: 'orthogonal-after-probe', touching });
    } else {
      result.set(path, { kind: 'joint-variant', touching, jointCases });
    }
  }

  return result;
}

/**
 * Stable key for value comparison — `JSON.stringify($value)`.
 * Composite tokens (shadow, typography, …) compare on every sub-field;
 * missing tokens compare equal to the empty string.
 */
function valueKey(token: TokenNormalized | undefined): string {
  if (!token) return '';
  return JSON.stringify(token.$value);
}
