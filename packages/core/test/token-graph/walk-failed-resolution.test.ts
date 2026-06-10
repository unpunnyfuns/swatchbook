import { describe, expect, it } from 'vitest';
import type { TokenGraph } from '#/token-graph/types.ts';
import { resolveAllAt, resolveAt } from '#/token-graph/walk.ts';

// A dangling alias (write target absent from the graph) resolves to undefined.
// resolveAllAt shares one memo across every node, so a failed resolution must
// not poison that memo: it used to leave CYCLE_SENTINEL behind, which a later
// node's lookup misread as a cycle and "resolved" to the dangling node's
// baseline — making output depend on Object.keys() iteration order and
// disagree with resolveAt on a fresh memo.
//
// `x` has a Dark alias write to a missing path; `y` aliases `x`. At mode=Dark
// both fail to resolve. `nodeOrder` controls insertion order so the two
// orderings exercise both memo-seeding sequences.
function danglingGraph(nodeOrder: 'x-first' | 'y-first'): TokenGraph {
  const x = {
    baselineValue: { $value: '#x', $type: 'color' },
    baselineKind: 'literal' as const,
    writes: { mode: { Dark: { kind: 'alias' as const, target: 'missing.path' } } },
    affectedBy: ['mode'],
    aliases: ['missing.path'],
    aliasedBy: ['y'],
  };
  const y = {
    baselineValue: { $value: '#y', $type: 'color' },
    baselineKind: 'alias' as const,
    baselineAliasTarget: 'x',
    writes: {},
    affectedBy: ['mode'],
    aliases: ['x'],
    aliasedBy: [],
  };
  const nodes = nodeOrder === 'x-first' ? { x, y } : { y, x };
  return { axes: ['mode'], axisDefaults: { mode: 'Light' }, nodes };
}

describe('failed resolution does not poison the shared memo', () => {
  it('resolveAt returns undefined for a dangling alias and the node aliasing it', () => {
    const graph = danglingGraph('x-first');
    expect(resolveAt(graph, 'x', { mode: 'Dark' })).toBeUndefined();
    expect(resolveAt(graph, 'y', { mode: 'Dark' })).toBeUndefined();
  });

  it('resolveAllAt omits the failed paths instead of resurrecting their baselines', () => {
    const result = resolveAllAt(danglingGraph('x-first'), { mode: 'Dark' });
    expect(result.x).toBeUndefined();
    expect(result.y).toBeUndefined();
  });

  it('resolveAllAt output is independent of node iteration order', () => {
    const xFirst = resolveAllAt(danglingGraph('x-first'), { mode: 'Dark' });
    const yFirst = resolveAllAt(danglingGraph('y-first'), { mode: 'Dark' });
    expect(xFirst).toEqual(yFirst);
  });

  it('resolveAllAt agrees with resolveAt for every node', () => {
    const graph = danglingGraph('x-first');
    const all = resolveAllAt(graph, { mode: 'Dark' });
    for (const path of ['x', 'y']) {
      expect(all[path]).toEqual(resolveAt(graph, path, { mode: 'Dark' }));
    }
  });
});
