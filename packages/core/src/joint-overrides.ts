import { buildResolveAt } from '#/resolve-at.ts';
import type { Axis, Cells, JointOverride, JointOverrides, Permutation, TokenMap } from '#/types.ts';

/**
 * Extract joint-override entries by exhaustive cartesian-divergence
 * probe — for every non-baseline permutation in
 * `permutationsResolved`, compose via cells alone (no overrides yet),
 * compare against the cartesian-resolved TokenMap, and record the
 * divergent tokens as a joint override keyed by the permutation's
 * non-default partial tuple.
 *
 * This is the PR-1 derivation. It guarantees `composeAt` is exactly
 * equivalent to `permutationsResolved` for every cartesian tuple,
 * including all-orders joint variance for free — no Phase 3 pair-only
 * probe gap. The follow-up that drops the cartesian materialization
 * replaces this with an analytical probe over the resolver directly.
 *
 * Override keys are sorted by arity on insertion so map iteration in
 * `composeAt` applies lower-order overrides before higher-order ones.
 */
export function buildJointOverrides(
  axes: readonly Axis[],
  permutations: readonly Permutation[],
  permutationsResolved: Readonly<Record<string, TokenMap>>,
  cells: Cells,
  defaultTuple: Readonly<Record<string, string>>,
): JointOverrides {
  // Probe in ascending arity. At each arity, compose against all
  // lower-arity overrides already recorded; the arity-N override
  // corrects any cases where the arity-(N-1) overrides set the wrong
  // value at an N-axis tuple. This is what makes the "higher arity
  // wins" property hold without losing the lower-arity benefits.
  const accumulated = new Map<string, JointOverride>();

  // Group permutations by partial-tuple arity (count of non-default axes).
  const byArity = new Map<number, Permutation[]>();
  let maxArity = 0;
  for (const perm of permutations) {
    let arity = 0;
    for (const axis of axes) {
      if (perm.input[axis.name] !== undefined && perm.input[axis.name] !== axis.default) {
        arity += 1;
      }
    }
    if (arity === 0) continue;
    if (!byArity.has(arity)) byArity.set(arity, []);
    byArity.get(arity)!.push(perm);
    if (arity > maxArity) maxArity = arity;
  }

  for (let arity = 1; arity <= maxArity; arity++) {
    const perms = byArity.get(arity) ?? [];
    const composer = buildResolveAt(axes, cells, accumulated, defaultTuple);
    for (const perm of perms) {
      const cartesian = permutationsResolved[perm.name];
      if (!cartesian) continue;
      const partialAxes: Record<string, string> = {};
      for (const axis of axes) {
        const v = perm.input[axis.name];
        if (v !== undefined && v !== axis.default) partialAxes[axis.name] = v;
      }
      const composed = composer(perm.input);
      const divergent: TokenMap = {};
      for (const path of Object.keys(cartesian)) {
        const cVal = cartesian[path];
        if (!cVal) continue;
        if (!sameValue(cVal, composed[path])) divergent[path] = cVal;
      }
      if (Object.keys(divergent).length === 0) continue;
      accumulated.set(canonicalKey(partialAxes), {
        axes: partialAxes,
        tokens: divergent,
      });
    }
  }

  return accumulated;
}

/**
 * Canonical key for a partial tuple — axes sorted by name so
 * `{A:a,B:b}` and `{B:b,A:a}` produce the same lookup key.
 */
export function jointOverrideKey(axes: Readonly<Record<string, string>>): string {
  return canonicalKey(axes);
}

function canonicalKey(axes: Readonly<Record<string, string>>): string {
  return Object.keys(axes)
    .toSorted()
    .map((k) => `${k}:${axes[k]}`)
    .join('|');
}

function sameValue(a: unknown, b: unknown): boolean {
  // Stable structural comparison on `$value` — same key
  // `analyzeAxisVariance` uses for variance bucketing.
  return JSON.stringify(getValue(a)) === JSON.stringify(getValue(b));
}

function getValue(t: unknown): unknown {
  if (t && typeof t === 'object' && '$value' in t) {
    return (t as { $value: unknown }).$value;
  }
  return undefined;
}
