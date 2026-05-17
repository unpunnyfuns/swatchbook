import type { Resolver } from '@terrazzo/parser';
import { buildResolveAt } from '#/resolve-at.ts';
import type { Axis, Cells, JointOverride, JointOverrides, TokenMap } from '#/types.ts';

/**
 * Two-pass joint-probe output:
 *
 *   - **`overrides`** — partial-tuple → divergent-tokens map. Fed
 *     into `resolveAt` so cell composition at the divergent tuples
 *     reproduces the cartesian-correct value.
 *   - **`jointTouching`** — path → set of axes that genuinely
 *     contribute to a joint divergence on that path (cartesian
 *     truth at the joint tuple differs from what the OTHER axis's
 *     cell alone would produce). Drives the "varying axis" set
 *     downstream consumers (variance display, smart emitter cell
 *     filtering) need, separated from the cell-composition-artifact
 *     overrides.
 */
export interface JointProbeResult {
  overrides: JointOverrides;
  jointTouching: ReadonlyMap<string, ReadonlySet<string>>;
}

/**
 * Probe every pair of `(axis, non-default-context)` combinations via
 * `resolver.apply` and derive two distinct signals from each probe:
 *
 *   1. `overrides` — records the cartesian-correct values for tokens
 *      whose joint value differs from cells composition. Drives
 *      `resolveAt`.
 *   2. `jointTouching` — marks axis A as touching path P when the
 *      joint value at `{A: ctxA, B: ctxB}` differs from
 *      `cells[B][ctxB][P]` (i.e. A's contribution beyond B alone is
 *      non-trivial). Symmetric for B. Drives variance display.
 *
 * The two signals diverge for tokens that pass through cell
 * composition unchanged but are still axis-dependent — e.g. the
 * reference fixture's `accent.fg` at `{Dark, BrandA}`: cells
 * composition gives the correct white because Brand A's cell
 * overwrites Dark's dark, so no override is recorded; but brand
 * does genuinely affect accent.fg jointly with mode (Dark+Default →
 * dark, Dark+BrandA → white), so the touching signal flags brand
 * even though no override is needed.
 *
 * Pair-only at this stage. Triple-and-higher joint variance is a
 * documented limitation; the algorithm extends naturally to arity N.
 *
 * Resolver-less projects (layered / plain-parse) return empty maps
 * — no resolver to probe with.
 */
export function probeJointOverrides(
  axes: readonly Axis[],
  cells: Cells,
  defaultTuple: Readonly<Record<string, string>>,
  resolver: Resolver | undefined,
): JointProbeResult {
  if (!resolver || axes.length < 2) {
    return { overrides: new Map(), jointTouching: new Map() };
  }

  const overrides = new Map<string, JointOverride>();
  const jointTouching = new Map<string, Set<string>>();
  // Baseline carries the values for paths that delta cells omit;
  // touching detection compares against this to avoid flagging
  // baseline-equal cells as "diverging from cartesian."
  const firstAxis = axes[0];
  const baseline: TokenMap = (firstAxis && cells[firstAxis.name]?.[firstAxis.default]) ?? {};

  const markJointTouching = (path: string, axisName: string): void => {
    let set = jointTouching.get(path);
    if (!set) {
      set = new Set<string>();
      jointTouching.set(path, set);
    }
    set.add(axisName);
  };

  // Iterate arity 2..axes.length. At each arity, build a composer
  // over `cells + accumulated overrides` so arity-N probes see the
  // (N-1)-level corrections already recorded — higher-arity
  // divergences get recorded only when they're not already implied
  // by a lower-arity override.
  for (let arity = 2; arity <= axes.length; arity++) {
    const composer = buildResolveAt(axes, cells, overrides, defaultTuple);

    for (const axisCombo of axisCombinations(axes, arity)) {
      for (const partialTuple of contextProducts(axisCombo)) {
        const fullTuple = { ...defaultTuple, ...partialTuple };
        const cartesian = resolver.apply(fullTuple);
        const composed = composer(fullTuple);
        const divergent: TokenMap = {};

        for (const path of Object.keys(cartesian)) {
          const cVal = cartesian[path];
          if (!cVal) continue;
          const cKey = valueKey(cVal);

          // Override: needed when cells + lower-arity-overrides
          // composition gives a different value.
          if (cKey !== valueKey(composed[path])) divergent[path] = cVal;

          // Touching: at arity 2, an axis genuinely contributes
          // when the joint value differs from "the other axis's
          // cell alone." At higher arities we mark every
          // participating axis on any divergent path
          // conservatively — establishing genuine contribution per
          // axis at arity N would require N leave-one-out probes
          // per path; the conservative marking errs on the side of
          // surfacing variance to consumers rather than hiding it.
          if (arity === 2) {
            const [axisA, axisB] = axisCombo as [Axis, Axis];
            const ctxA = partialTuple[axisA.name] as string;
            const ctxB = partialTuple[axisB.name] as string;
            const cellA = cells[axisA.name]?.[ctxA] ?? {};
            const cellB = cells[axisB.name]?.[ctxB] ?? {};
            // Fall back to baseline for delta cells that omit this
            // path — "axis didn't touch it" should not look like
            // divergence from cartesian.
            const cellBVal = valueKey(cellB[path] ?? baseline[path]);
            const cellAVal = valueKey(cellA[path] ?? baseline[path]);
            if (cKey !== cellBVal) markJointTouching(path, axisA.name);
            if (cKey !== cellAVal) markJointTouching(path, axisB.name);
          } else if (cKey !== valueKey(composed[path])) {
            // Arity ≥ 3 with a divergence at this tuple: every
            // participating axis is conservatively marked.
            for (const axis of axisCombo) markJointTouching(path, axis.name);
          }
        }

        if (Object.keys(divergent).length > 0) {
          overrides.set(canonicalKey(partialTuple), {
            axes: partialTuple,
            tokens: divergent,
          });
        }
      }
    }
  }

  return { overrides, jointTouching };
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

function valueKey(token: unknown): string {
  if (token && typeof token === 'object' && '$value' in token) {
    return JSON.stringify((token as { $value: unknown }).$value);
  }
  return '';
}
