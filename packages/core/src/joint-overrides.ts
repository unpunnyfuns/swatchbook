import type { Resolver } from '@terrazzo/parser';
import { buildResolveAt } from '#/resolve-at.ts';
import { canonicalKey } from '#/tuple-key.ts';
import type { TupleKey } from '#/tuple-key.ts';
import type { Axis, Cells, JointOverride, JointOverrides, TokenMap } from '#/types.ts';
import { valueKey } from '#/value-key.ts';

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
 * The probe iterates arity 2..`maxArity` (default `axes.length`). At
 * each arity, every divergent partial tuple is recorded as an override
 * the cell-composer can patch back in. Higher arities are bounded only
 * by `C(N, k) × Π(ctx_i - 1)` over the chosen combo — combinatorial
 * at scale (11 axes with rich context counts → millions of
 * `resolver.apply` calls). `options.maxArity` caps the sweep; pair-only
 * is empirically sufficient for real-world joint divergences observed
 * so far, and is the bench's default for large fixtures.
 *
 * Resolver-less projects (layered / plain-parse) return empty
 * collections — no resolver to probe with.
 */
export interface ProbeOptions {
  /**
   * Inclusive maximum arity to probe. Defaults to `axes.length` — the
   * full sweep. Capping is useful for benchmarks and for projects with
   * many axes where arity-3+ probes explode combinatorially: at 11
   * axes a context-rich fixture can reach millions of `resolver.apply`
   * calls. Real-world joint divergences observed so far are pair-
   * shaped; higher arities are conservative coverage, not load-bearing
   * correctness.
   */
  maxArity?: number;
}

export function probeJointOverrides(
  axes: readonly Axis[],
  cells: Cells,
  defaultTuple: Readonly<Record<string, string>>,
  resolver: Resolver | undefined,
  options: ProbeOptions = {},
): JointProbeResult {
  if (!resolver || axes.length < 2) {
    return { overrides: [], jointTouching: new Map() };
  }

  // Consume the per-arity generator and accumulate. Generator yields
  // an incremental snapshot after each arity so callers that only want
  // pair-level divergence (the bench, or a `maxArity: 2` consumer) can
  // stop early without paying for higher arities.
  let result: JointProbeResult = { overrides: [], jointTouching: new Map() };
  for (const snapshot of probeJointOverridesByArity(axes, cells, defaultTuple, resolver, options)) {
    result = snapshot;
  }
  return result;
}

/**
 * Per-arity generator. Yields the accumulated `{ overrides, jointTouching }`
 * after completing each arity from 2 up to `options.maxArity ?? axes.length`.
 *
 * Each yielded value is a fresh materialization — caller-visible iteration
 * order is "after arity 2 ... after arity 3 ..." Caller decides when to
 * stop; breaking out of the `for...of` skips remaining arities, which is
 * the load-bearing affordance for the bench harness and for caller-driven
 * budgeting (e.g. abort when wall-clock exceeds a threshold).
 *
 * The generator itself is internal; the publicly-exported entry is the
 * materializing wrapper above. Both share the same options.
 */
export function* probeJointOverridesByArity(
  axes: readonly Axis[],
  cells: Cells,
  defaultTuple: Readonly<Record<string, string>>,
  resolver: Resolver,
  options: ProbeOptions = {},
): Generator<JointProbeResult> {
  // Internal Map keyed on canonicalKey for dedupe across arity passes.
  // Materialized to the public array shape on each yield so consumers
  // see the same wire-friendly shape `loadProject` expects.
  const overrides = new Map<TupleKey, JointOverride>();
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

  const maxArity = Math.min(options.maxArity ?? axes.length, axes.length);

  // Iterate arity 2..maxArity. At each arity, build a composer over
  // `cells + accumulated overrides` so arity-N probes see the (N-1)-level
  // corrections already recorded — higher-arity divergences get recorded
  // only when they're not already implied by a lower-arity override.
  for (let arity = 2; arity <= maxArity; arity++) {
    const composer = buildResolveAt(axes, cells, [...overrides.entries()], defaultTuple);

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
            const ctxA = partialTuple[axisA.name];
            const ctxB = partialTuple[axisB.name];
            if (ctxA === undefined || ctxB === undefined) continue;
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

    yield { overrides: [...overrides.entries()], jointTouching };
  }
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
export function jointOverrideKey(axes: Readonly<Record<string, string>>): TupleKey {
  return canonicalKey(axes);
}
