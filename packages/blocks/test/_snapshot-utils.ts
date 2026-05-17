import type { ProjectSnapshot, VirtualTokenShape } from '#/contexts.ts';

/**
 * Hand-built test snapshots historically populated `permutations` +
 * `permutationsResolved` directly. The wire format moved to `cells` +
 * `jointOverrides` + `defaultTuple` in PR 6a; `useProject`'s
 * `snapshotResolveAt` retained a fallback that resolved only the
 * active-permutation TokenMap so those fixtures kept passing.
 *
 * This helper derives the new shape from the old, so tests can keep
 * their existing `makeSnapshot()` ergonomics and the production
 * fallback can be deleted with #815 Part 3. Single-axis fixtures
 * resolve trivially (one cell entry, no joint overrides);
 * multi-context fixtures derive deltas vs the active baseline.
 */
export function withCellsShape<T extends ProjectSnapshot>(snapshot: T): T {
  const defaultTuple: Record<string, string> = {};
  for (const axis of snapshot.axes) {
    defaultTuple[axis.name] = snapshot.activeAxes[axis.name] ?? axis.default;
  }

  const baseline = snapshot.permutationsResolved?.[snapshot.activePermutation] ?? {};

  const cells: NonNullable<ProjectSnapshot['cells']> = {};
  for (const axis of snapshot.axes) {
    const axisCells: Record<string, Record<string, VirtualTokenShape>> = {};
    for (const ctx of axis.contexts) {
      const cellTuple = { ...defaultTuple, [axis.name]: ctx };
      const tokens = findPermResolved(snapshot, cellTuple);
      if (ctx === axis.default || ctx === defaultTuple[axis.name]) {
        axisCells[ctx] = tokens ?? baseline;
      } else if (tokens) {
        const delta: Record<string, VirtualTokenShape> = {};
        for (const [path, token] of Object.entries(tokens)) {
          const b = baseline[path];
          if (!b || JSON.stringify(b.$value) !== JSON.stringify(token.$value)) {
            delta[path] = token;
          }
        }
        axisCells[ctx] = delta;
      } else {
        axisCells[ctx] = {};
      }
    }
    cells[axis.name] = axisCells;
  }

  return {
    ...snapshot,
    cells,
    jointOverrides: snapshot.jointOverrides ?? [],
    defaultTuple,
  } as T;
}

function findPermResolved(
  snapshot: ProjectSnapshot,
  tuple: Readonly<Record<string, string>>,
): Record<string, VirtualTokenShape> | undefined {
  const perms = snapshot.permutations ?? [];
  const resolved = snapshot.permutationsResolved ?? {};
  for (const perm of perms) {
    let match = true;
    for (const k of Object.keys(tuple)) {
      if ((perm.input as Record<string, string>)[k] !== tuple[k]) {
        match = false;
        break;
      }
    }
    if (match) return resolved[perm.name];
  }
  return undefined;
}
