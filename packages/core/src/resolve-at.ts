/**
 * Browser-safe `resolveAt` builder. Exported through the
 * `@unpunnyfuns/swatchbook-core/resolve-at` subpath so the preview
 * + blocks can import it without pulling in the Terrazzo parser
 * (which the main `@unpunnyfuns/swatchbook-core` barrel transitively
 * depends on and which is Node-only). The subpath split is
 * load-bearing for the addon's preview bundle and any browser
 * consumer that needs to compose tokens at any tuple without
 * shipping `@terrazzo/parser` to the client.
 */
import type { Axis, Cells, JointOverrides, ResolveAt, TokenMap } from '#/types.ts';

/**
 * Build a `resolveAt(tuple)` accessor that composes the full
 * `TokenMap` for any tuple of axis selections — no resolver call
 * needed.
 *
 * Composition rules:
 *
 *   1. Start from the baseline cell (any axis's default-context map;
 *      they agree by construction since every default-cell is the
 *      result of `resolver.apply(defaultTuple)`).
 *   2. For each axis whose tuple value differs from its default, layer
 *      `cells[axis][value]` over the result in project axis order.
 *      Cells contain the full TokenMap, so orthogonal-axis cells re-emit
 *      baseline values harmlessly while single-axis-variant tokens get
 *      their per-axis values written.
 *   3. Apply joint overrides whose `axes` is a subset of the requested
 *      tuple, in ascending arity. Higher-order divergences win because
 *      `jointOverrides` is sorted on construction.
 *
 * Partial tuples are allowed — any axis missing from `tuple` falls
 * back to its `defaultTuple` value. Results are memoized on the
 * canonical (post-default-fill) tuple key.
 */
export function buildResolveAt(
  axes: readonly Axis[],
  cells: Cells,
  jointOverrides: JointOverrides,
  defaultTuple: Readonly<Record<string, string>>,
): ResolveAt {
  const memo = new Map<string, TokenMap>();
  return function resolveAt(tuple: Record<string, string>): TokenMap {
    const full: Record<string, string> = { ...defaultTuple };
    for (const axis of axes) {
      const val = tuple[axis.name];
      if (val !== undefined) full[axis.name] = val;
    }
    const key = canonicalKey(full);
    const cached = memo.get(key);
    if (cached) return cached;

    const result: TokenMap = {};
    // Step 1: baseline from any axis's default cell.
    const firstAxis = axes[0];
    if (firstAxis) {
      const baseline = cells[firstAxis.name]?.[firstAxis.default];
      if (baseline) Object.assign(result, baseline);
    }
    // Step 2: layer non-default cells in project axis order.
    for (const axis of axes) {
      const ctx = full[axis.name];
      if (ctx === undefined || ctx === axis.default) continue;
      const cell = cells[axis.name]?.[ctx];
      if (cell) Object.assign(result, cell);
    }
    // Step 3: joint overrides. Map iteration is insertion order =
    // ascending arity, so larger overrides naturally win.
    for (const override of jointOverrides.values()) {
      if (!isSubset(override.axes, full)) continue;
      Object.assign(result, override.tokens);
    }

    memo.set(key, result);
    return result;
  };
}

function isSubset(
  sub: Readonly<Record<string, string>>,
  full: Readonly<Record<string, string>>,
): boolean {
  for (const key of Object.keys(sub)) {
    if (full[key] !== sub[key]) return false;
  }
  return true;
}

function canonicalKey(tuple: Readonly<Record<string, string>>): string {
  return Object.keys(tuple)
    .toSorted()
    .map((k) => `${k}:${tuple[k]}`)
    .join('|');
}
