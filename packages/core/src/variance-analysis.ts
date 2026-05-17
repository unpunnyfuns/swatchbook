import type { TokenNormalized } from '@terrazzo/parser';
import type { Axis, Project, TokenMap } from '#/types.ts';

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
 *    its value at any tuple. Uses the same logic `analyzeAxisVariance`
 *    applies: bucket permutations by tuple-minus-this-axis; if any
 *    bucket holds two contexts whose token values differ, the axis
 *    touches this token. The naive "compare singleton cell to baseline"
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
  const { axes, permutations, permutationsResolved, parserInput } = project;

  if (axes.length === 0) {
    // No axes → every token is baseline-only. Skip the cell + probe work.
    for (const path of Object.keys(project.graph)) {
      result.set(path, { kind: 'baseline-only' });
    }
    return result;
  }

  // Phase 1 — locate the baseline tuple + per-axis non-default cells.
  const defaultTuple: Record<string, string> = {};
  for (const axis of axes) defaultTuple[axis.name] = axis.default;
  const baselinePerm = findPermByTuple(permutations, defaultTuple);
  const baseline: TokenMap = baselinePerm
    ? (permutationsResolved[baselinePerm.name] ?? {})
    : project.graph;

  // cells[axis.name][ctx] = TokenMap for { ...defaults, [axis.name]: ctx }.
  // Missing cells (resolver pruned a tuple, disabledAxes filtered it) are
  // treated as "no overlay" — the token's value at that cell equals baseline.
  const cells: Record<string, Record<string, TokenMap>> = {};
  for (const axis of axes) {
    const axisCells: Record<string, TokenMap> = {};
    for (const ctx of axis.contexts) {
      if (ctx === axis.default) continue;
      const cellTuple = { ...defaultTuple, [axis.name]: ctx };
      const cellPerm = findPermByTuple(permutations, cellTuple);
      if (cellPerm) axisCells[ctx] = permutationsResolved[cellPerm.name] ?? {};
    }
    cells[axis.name] = axisCells;
  }

  // Phase 2 — touching set per token. Build the union of every token path
  // mentioned by baseline or any cell, then for each token use
  // `analyzeAxisVariance` (variance.ts) to find every axis whose contexts
  // produce different values when other axes are held constant. This
  // catches joint-only touching: an axis whose effect is hidden when
  // others sit at defaults but becomes load-bearing under specific
  // combinations (Brand A's `accent.fg = white` matches baseline white,
  // so its singleton cell looks like a no-op — but in combination with
  // Dark mode where the baseline value is overridden, Brand A's white
  // is genuinely an override).
  const allPaths = new Set<string>(Object.keys(baseline));
  for (const axisCells of Object.values(cells)) {
    for (const cell of Object.values(axisCells)) {
      for (const path of Object.keys(cell)) allPaths.add(path);
    }
  }

  // Use the project's cached per-path variance instead of re-running
  // the bucket analysis. The cache is populated at load time using the
  // same algorithm `analyzeAxisVariance` exposes; reading it lets the
  // smart emitter avoid quadratic-in-path bucket work per build.
  const touchingByPath = new Map<string, Set<string>>();
  for (const path of allPaths) {
    const cached = project.varianceByPath.get(path);
    touchingByPath.set(path, new Set(cached?.varyingAxes ?? []));
  }

  // Partition + Phase 3 (joint probe for multi-touch only). Phase 3 needs
  // resolver.apply, which only resolver-backed projects have; for layered
  // / plain-parse we conservatively mark multi-touch as joint-variant
  // (empty jointCases — emitter falls back to cartesian-style emit).
  const resolver = parserInput?.resolver;

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

    if (!resolver) {
      // Conservative: treat as joint-variant. Empty jointCases — the emitter
      // signals "I can't determine joint correctness, emit cartesian-style."
      result.set(path, { kind: 'joint-variant', touching, jointCases: [] });
      continue;
    }

    const jointCases = probeJointPairs(
      path,
      touching,
      axes,
      defaultTuple,
      cells,
      baseline,
      resolver,
      permutations,
      permutationsResolved,
    );
    if (jointCases.length === 0) {
      result.set(path, { kind: 'orthogonal-after-probe', touching });
    } else {
      result.set(path, { kind: 'joint-variant', touching, jointCases });
    }
  }

  return result;
}

/**
 * For a multi-touch token, probe every pair of touching axes at every
 * non-default combination. Compare the cartesian-resolved value against
 * what projection composition would produce; record the divergences.
 *
 * Composition assumes the "smart dedup" rule: a cell re-emits its value
 * for any token touched by ANY cell (not just when this cell differs
 * from baseline). Under that rule, projection composition at a joint
 * `(A, B)` tuple equals the value of whichever of `cells[A][ctx_a]` /
 * `cells[B][ctx_b]` is emitted later in source order — by axis iteration
 * order. We match that by checking the B-cell value (B iterated after A).
 */
function probeJointPairs(
  path: string,
  touching: ReadonlySet<string>,
  axes: readonly Axis[],
  defaultTuple: Record<string, string>,
  cells: Record<string, Record<string, TokenMap>>,
  baseline: TokenMap,
  resolver: NonNullable<Project['parserInput']>['resolver'],
  permutations: Project['permutations'],
  permutationsResolved: Project['permutationsResolved'],
): JointCase[] {
  const cases: JointCase[] = [];
  // Stable axis-pair iteration in project axis order — gives deterministic
  // output and matches the cascade order the emitter will use.
  const touchingAxes = axes.filter((a) => touching.has(a.name));

  for (let i = 0; i < touchingAxes.length; i++) {
    for (let j = i + 1; j < touchingAxes.length; j++) {
      const axisA = touchingAxes[i] as Axis;
      const axisB = touchingAxes[j] as Axis;
      const cellsA = cells[axisA.name] ?? {};
      const cellsB = cells[axisB.name] ?? {};

      for (const ctxA of Object.keys(cellsA)) {
        for (const ctxB of Object.keys(cellsB)) {
          // Cartesian truth via resolver.apply.
          const jointTuple = { ...defaultTuple, [axisA.name]: ctxA, [axisB.name]: ctxB };
          const cartesianTokens = resolver.apply(jointTuple);
          const cartesianValueKey = valueKey(cartesianTokens[path]);

          // Projection composition under smart dedup: B is later in source
          // order than A, so B's cell value wins when both touch the token.
          // Falls back to A if only A's cell holds a value, else baseline.
          const projectionValueKey =
            valueKey(cellsB[ctxB]?.[path]) ||
            valueKey(cellsA[ctxA]?.[path]) ||
            valueKey(baseline[path]);

          if (cartesianValueKey === projectionValueKey) continue;

          // Divergence — record the joint case. Look up the permutation
          // name so downstream emit can find the full TokenNormalized.
          const jointPerm = findPermByTuple(permutations, jointTuple);
          if (!jointPerm) continue;
          if (permutationsResolved[jointPerm.name] === undefined) continue;
          cases.push({
            axisA: axisA.name,
            ctxA,
            axisB: axisB.name,
            ctxB,
            cartesianValueKey,
            permutationName: jointPerm.name,
          });
        }
      }
    }
  }

  return cases;
}

/**
 * Locate the permutation whose `input` exactly matches the given tuple.
 * Returns `undefined` when no permutation matches — happens when
 * `disabledAxes` filtered the tuple out, or when the resolver's
 * cartesian was pruned. Callers handle this as "no overlay applies."
 */
function findPermByTuple(
  permutations: Project['permutations'],
  tuple: Readonly<Record<string, string>>,
): Project['permutations'][number] | undefined {
  const keys = Object.keys(tuple);
  return permutations.find((perm) => {
    for (const key of keys) {
      if (perm.input[key] !== tuple[key]) return false;
    }
    return Object.keys(perm.input).length === keys.length;
  });
}

/**
 * Stable key for value comparison — `JSON.stringify($value)`. Mirrors
 * `analyzeAxisVariance`'s comparator so composite tokens (shadow,
 * typography, …) compare on every sub-field and missing tokens compare
 * equal to the empty string.
 */
function valueKey(token: TokenNormalized | undefined): string {
  if (!token) return '';
  return JSON.stringify(token.$value);
}
