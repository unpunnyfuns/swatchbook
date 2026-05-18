import type { Axis, TokenMap } from '#/types.ts';

/**
 * Alias-aware connectivity graph over the project's axes.
 *
 * Two products fall out of the resolver-source + baseline-token-map
 * walks:
 *
 *   - `pathsByAxisContext[A][c]` — the set of token paths axis A's
 *     overlay file for context c explicitly declares (recursive
 *     descent collecting paths of nodes that carry a `$value`).
 *     Source: `resolver.source.modifiers[A].contexts[c]` (the
 *     inlined-Group array Terrazzo populates).
 *   - `reachableFromPath[P]` — `{ P, …aliasChain, …partialAliasOf
 *     targets, transitively }`. The transitive alias-closure of a
 *     baseline-resolved path, capturing every other path whose
 *     value `P`'s value depends on.
 *
 * Composing the two: axis A's "reach" is `⋃ over non-default contexts
 * c of writes[A][c] ∪ reachableFromPath[P] for P in writes[A][c]`.
 * Two axes are `connected` iff their reach sets intersect.
 * `isAxisComboConnected` extends to arity N by requiring the combo's
 * induced subgraph (axis nodes, edges restricted to in-combo
 * endpoints) to be a single connected component — a combo that
 * spans two disjoint clusters can't produce a joint divergence and
 * is safely culled. Stays conservative: false orthogonals would drop
 * a real divergence; false connecteds just probe an extra tuple.
 *
 * `probeJointOverrides` accepts an optional graph and skips
 * combinations the graph reports as orthogonal. Without one, it
 * brute-forces the full pair-and-up combinatorial space.
 */
export interface AliasGraph {
  pathsByAxisContext: Map<string, Map<string, Set<string>>>;
  reachableFromPath: Map<string, Set<string>>;
  connectedAxes: Map<string, Set<string>>;
}

export interface BuildAliasGraphInput {
  axes: readonly Axis[];
  /**
   * Walked recursively to extract per-(axis, context) declared paths.
   * Source: `Resolver.source.modifiers` from `@terrazzo/parser`'s
   * `loadResolver` — `contexts` maps context name → array of inlined
   * Group nodes whose leaves carry `$value`.
   */
  resolverModifiers: Record<
    string,
    { contexts?: Record<string, unknown[]> | undefined; default?: string | undefined }
  >;
  /**
   * The default-tuple-resolved `TokenMap`. Used to follow each path's
   * `aliasChain` (transitively populated by Terrazzo) and recursive
   * `partialAliasOf` targets to build `reachableFromPath`.
   */
  baseline: TokenMap;
}

export function buildAliasGraph(input: BuildAliasGraphInput): AliasGraph {
  const { axes, resolverModifiers, baseline } = input;

  // 1. Walk resolver source modifiers → per-axis, per-context declared paths.
  // Track which axes use `$extends` in any non-default context — those
  // axes get a wildcard-connection marker (see step 4).
  const pathsByAxisContext = new Map<string, Map<string, Set<string>>>();
  const wildcardAxes = new Set<string>();
  for (const axis of axes) {
    const modifier = resolverModifiers[axis.name];
    if (!modifier?.contexts) continue;
    const perContext = new Map<string, Set<string>>();
    for (const [contextName, groupNodes] of Object.entries(modifier.contexts)) {
      // Default context is the baseline by construction; the probe
      // never iterates it on the join side, so we don't need to walk
      // its writes either.
      if (contextName === axis.default) continue;
      const paths = new Set<string>();
      let sawExtends = false;
      for (const node of groupNodes) {
        if (collectPathsWithValue(node, '', paths)) sawExtends = true;
      }
      if (sawExtends) wildcardAxes.add(axis.name);
      if (paths.size > 0) perContext.set(contextName, paths);
    }
    pathsByAxisContext.set(axis.name, perContext);
  }

  // 2. Build reachableFromPath via aliasChain + partialAliasOf closure.
  const reachableFromPath = new Map<string, Set<string>>();
  for (const path of Object.keys(baseline)) {
    const reach = new Set<string>([path]);
    expandReach(path, baseline, reach);
    reachableFromPath.set(path, reach);
  }

  // 3. axisReach[A] = ⋃ over non-default c of writes[A][c] ∪
  //    reachableFromPath[P] for P in writes[A][c].
  const axisReach = new Map<string, Set<string>>();
  for (const axis of axes) {
    const reach = new Set<string>();
    const perContext = pathsByAxisContext.get(axis.name);
    if (perContext) {
      for (const paths of perContext.values()) {
        for (const path of paths) {
          reach.add(path);
          const transitively = reachableFromPath.get(path);
          if (transitively) for (const r of transitively) reach.add(r);
        }
      }
    }
    axisReach.set(axis.name, reach);
  }

  // 4. Pair (A, B) connected iff axisReach[A] ∩ axisReach[B] non-empty,
  //    OR either axis is wildcard-marked (used `$extends`). The wildcard
  //    marker is the conservative bail for `$extends`: Terrazzo's
  //    `loadResolver` leaves `$extends` directives un-flattened in
  //    `resolver.source.modifiers`, so the literal walk above misses
  //    inherited paths. Rather than silently mis-cull, we widen the
  //    affected axes to "could be anywhere" and let the probe re-confirm.
  const connectedAxes = new Map<string, Set<string>>();
  for (const axis of axes) connectedAxes.set(axis.name, new Set());
  for (let i = 0; i < axes.length; i++) {
    const a = axes[i]!;
    for (let j = i + 1; j < axes.length; j++) {
      const b = axes[j]!;
      const wildcard = wildcardAxes.has(a.name) || wildcardAxes.has(b.name);
      if (wildcard) {
        connectedAxes.get(a.name)!.add(b.name);
        connectedAxes.get(b.name)!.add(a.name);
        continue;
      }
      const reachA = axisReach.get(a.name)!;
      const reachB = axisReach.get(b.name)!;
      if (reachA.size === 0 || reachB.size === 0) continue;
      if (setsIntersect(reachA, reachB)) {
        connectedAxes.get(a.name)!.add(b.name);
        connectedAxes.get(b.name)!.add(a.name);
      }
    }
  }

  return { pathsByAxisContext, reachableFromPath, connectedAxes };
}

/**
 * A combo of axes is "connected" iff the subgraph induced by the
 * combo (axis nodes, edges restricted to in-combo endpoints) is a
 * single connected component. Arity < 2 combos pass trivially —
 * `probeJointOverrides` skips them anyway, but the helper stays
 * well-defined.
 *
 * Implementation: BFS from `combo[0]`, only traversing edges whose
 * other endpoint is also in `combo`. Combo is connected iff every
 * axis is visited.
 *
 * Conservative still: falsely orthogonal classifications would skip a
 * real divergence — falsely connected classifications just probe a
 * tuple that finds no divergence, costing a few `resolver.apply`
 * calls. The strict-component test tightens culling over the prior
 * "every axis has ≥1 in-combo partner" heuristic without crossing
 * into the wrong-answer side: a combo spanning two disjoint clusters
 * can't produce a joint divergence — the cross-cluster cartesian is
 * the independent product of two unrelated value sets.
 */
export function isAxisComboConnected(graph: AliasGraph, combo: readonly Axis[]): boolean {
  if (combo.length < 2) return true;
  const inCombo = new Set(combo.map((a) => a.name));
  const visited = new Set<string>([combo[0]!.name]);
  const queue: string[] = [combo[0]!.name];
  while (queue.length > 0) {
    const cur = queue.shift()!;
    const neighbours = graph.connectedAxes.get(cur);
    if (!neighbours) continue;
    for (const n of neighbours) {
      if (!inCombo.has(n) || visited.has(n)) continue;
      visited.add(n);
      queue.push(n);
    }
  }
  return visited.size === combo.length;
}

/**
 * Recursively walk a Terrazzo Group node. Any subnode that has a
 * `$value` is a token leaf; its absolute path is `prefix` joined with
 * the keys we descended through. Skip DTCG meta keys (`$type`,
 * `$description`, `$extensions`, `$defs`) and the `$value` itself.
 *
 * Returns `true` if any `$extends` directive was encountered during
 * the walk. Terrazzo's `loadResolver` leaves these un-flattened in
 * `resolver.source.modifiers` (flattening only runs lazily inside
 * `apply()`), so the literal walk can't observe the inherited paths.
 * The caller widens the affected axis to wildcard-connected rather
 * than risk a silent mis-cull. See issue #971 for the active-expand
 * follow-up.
 */
function collectPathsWithValue(node: unknown, prefix: string, out: Set<string>): boolean {
  if (!isPlainObject(node)) return false;
  if ('$value' in node) {
    if (prefix) out.add(prefix);
    return false;
  }
  let sawExtends = '$extends' in node;
  for (const [key, child] of Object.entries(node)) {
    if (key.startsWith('$')) continue;
    const childPath = prefix ? `${prefix}.${key}` : key;
    if (collectPathsWithValue(child, childPath, out)) sawExtends = true;
  }
  return sawExtends;
}

/**
 * Expand the reach set for a given path: add every entry from the
 * token's `aliasChain` (Terrazzo populates transitively, so one read
 * captures the full chain) plus every direct target referenced in its
 * `partialAliasOf` map. `partialAliasOf` is NOT transitive in
 * Terrazzo — each composite carries only its immediate sub-field
 * targets — so we recursively chase each target through its own
 * `aliasChain` + `partialAliasOf` to capture the full transitive
 * reach. Without this, a composite whose sub-field points to a token
 * with its own onward alias chain would under-report its reach,
 * causing the axis graph to silently mis-cull connected axis pairs.
 *
 * The `reach` Set doubles as a cycle guard: a recursive visit that
 * lands on an already-reached path returns immediately, so a cyclic
 * `partialAliasOf` (A→B→A) terminates with `reach = {A, B}` on each
 * starting path.
 */
function expandReach(path: string, baseline: TokenMap, reach: Set<string>): void {
  const token = baseline[path];
  if (!token) return;
  if (token.aliasChain) {
    for (const next of token.aliasChain) reach.add(next);
  }
  if (token.partialAliasOf !== undefined) {
    collectPartialAliasTargets(token.partialAliasOf, (next) => {
      if (reach.has(next)) return;
      reach.add(next);
      expandReach(next, baseline, reach);
    });
  }
}

/**
 * `partialAliasOf` shape varies by composite type:
 *
 *   - object of `field → path` (border, typography, transition, …)
 *   - array of such objects (shadow, gradient)
 *   - nested object (rare; future-proofing)
 *
 * A recursive walk collecting every leaf string handles all three
 * without per-type branching.
 */
function collectPartialAliasTargets(value: unknown, visit: (path: string) => void): void {
  if (typeof value === 'string') {
    visit(value);
    return;
  }
  if (Array.isArray(value)) {
    for (const entry of value) collectPartialAliasTargets(entry, visit);
    return;
  }
  if (isPlainObject(value)) {
    for (const v of Object.values(value)) collectPartialAliasTargets(v, visit);
  }
}

function setsIntersect(a: Set<string>, b: Set<string>): boolean {
  const [small, large] = a.size <= b.size ? [a, b] : [b, a];
  for (const item of small) if (large.has(item)) return true;
  return false;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
