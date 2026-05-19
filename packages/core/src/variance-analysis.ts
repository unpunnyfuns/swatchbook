import type { Project } from '#/types.ts';
import { resolveAllAt } from '#/token-graph/walk.ts';
import { listPaths } from '#/token-graph/queries.ts';
import { permutationID } from '#/types.ts';
import { valueKey } from '#/value-key.ts';

/**
 * Per-token variance classification across a loaded project's axes.
 *
 * `analyzeProjectVariance` classifies each token by how it varies
 * across axes, then lets the emitter route per-token:
 *
 * - **Baseline-only** — same value at every tuple; emit once in `:root`.
 * - **Single-axis** — varies only with one named axis; emit in `:root` +
 *   per-axis cells via standard projection.
 * - **Orthogonal-after-probe** — varies with 2+ axes but cell-composition
 *   matches the cartesian truth at all joint tuples; emit via projection.
 * - **Joint-variant** — cell-composition diverges from cartesian at one
 *   or more joint tuples; emit compound `[data-A][data-B]` selectors.
 *
 * Reads entirely from `project.tokenGraph` — no `cells`, `jointOverrides`,
 * or `varianceByPath` needed.
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
   * Stringified `$value` at the joint tuple — the spec-correct value
   * that compound-selector emit must reproduce.
   */
  cartesianValueKey: string;
  /** Synthesized name for the joint tuple — `axisValues.join(' · ')`. */
  permutationName: string;
}

/**
 * Classify every token in a project. Returns a Map keyed by token path.
 * Reads from `project.tokenGraph` — the sole resolution surface.
 */
export function analyzeProjectVariance(project: Project): Map<string, VarianceInfo> {
  const result = new Map<string, VarianceInfo>();
  const { axes, tokenGraph, defaultTuple } = project;

  if (axes.length === 0) {
    for (const path of listPaths(tokenGraph)) {
      result.set(path, { kind: 'baseline-only' });
    }
    return result;
  }

  for (const path of listPaths(tokenGraph)) {
    const node = tokenGraph.nodes[path];
    if (!node) continue;
    const touching: Set<string> = new Set(node.affectedBy);

    if (touching.size === 0) {
      result.set(path, { kind: 'baseline-only' });
      continue;
    }

    if (touching.size === 1) {
      const [axis] = touching;
      if (axis === undefined) continue;
      result.set(path, { kind: 'single-axis', axis });
      continue;
    }

    // touching.size >= 2 — probe for joint divergence.
    // For each pair of touching axes, compare the cartesian-resolved value
    // against the projected (per-axis composition) value. If they diverge,
    // the token is joint-variant on that combination.
    const touchingAxes = [...touching];
    const jointCases: JointCase[] = [];

    for (let i = 0; i < touchingAxes.length; i++) {
      for (let j = i + 1; j < touchingAxes.length; j++) {
        const axisA = touchingAxes[i]!;
        const axisB = touchingAxes[j]!;
        const axisADef = tokenGraph.axisDefaults[axisA] ?? '';
        const axisBDef = tokenGraph.axisDefaults[axisB] ?? '';
        const axisACtxs = (tokenGraph.axisContexts[axisA] ?? []).filter((c) => c !== axisADef);
        const axisBCtxs = (tokenGraph.axisContexts[axisB] ?? []).filter((c) => c !== axisBDef);

        for (const ctxA of axisACtxs) {
          for (const ctxB of axisBCtxs) {
            const jointTuple = { ...defaultTuple, [axisA]: ctxA, [axisB]: ctxB };
            const cartesianToken = resolveAllAt(tokenGraph, jointTuple)[path];
            const cartKey = valueKey(cartesianToken);

            // Projection-composed value: apply axis A's singleton cell
            // then axis B's singleton cell over the baseline.
            const afterA = resolveAllAt(tokenGraph, { ...defaultTuple, [axisA]: ctxA })[path];
            const afterB = resolveAllAt(tokenGraph, { ...defaultTuple, [axisB]: ctxB })[path];
            // Cascade composition: last non-default axis wins for
            // orthogonal tokens; check both directions.
            const projKeyAB = valueKey(afterB);
            const projKeyBA = valueKey(afterA);

            if (cartKey !== projKeyAB && cartKey !== projKeyBA) {
              jointCases.push({
                axisA,
                ctxA,
                axisB,
                ctxB,
                cartesianValueKey: cartKey,
                permutationName: permutationID(jointTuple),
              });
            }
          }
        }
      }
    }

    if (jointCases.length === 0) {
      result.set(path, { kind: 'orthogonal-after-probe', touching });
    } else {
      result.set(path, { kind: 'joint-variant', touching, jointCases });
    }
  }

  return result;
}
