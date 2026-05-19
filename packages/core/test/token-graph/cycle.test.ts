import { describe, expect, it } from 'vitest';
import type { TokenGraph } from '#/token-graph/types.ts';
import { resolveAliasAt, resolveAt } from '#/token-graph/walk.ts';

describe('alias cycle handling', () => {
  it('returns cycle entry baseline when chain forms a loop', () => {
    const graph: TokenGraph = {
      axes: ['mode'],
      axisDefaults: { mode: 'Light' },
      nodes: {
        a: {
          baselineValue: { $value: '#aaa', $type: 'color' },
          baselineKind: 'alias',
          baselineAliasTarget: 'b',
          writes: {},
          affectedBy: ['mode'],
          aliases: ['b'],
          aliasedBy: ['b'],
        },
        b: {
          baselineValue: { $value: '#bbb', $type: 'color' },
          baselineKind: 'alias',
          baselineAliasTarget: 'a',
          writes: {},
          affectedBy: ['mode'],
          aliases: ['a'],
          aliasedBy: ['a'],
        },
      },
    };
    const result = resolveAt(graph, 'a', { mode: 'Dark' });
    expect(result?.$value).toBe('#aaa');
  });

  it('terminates without exceeding call stack on a three-node cycle', () => {
    const graph: TokenGraph = {
      axes: ['mode'],
      axisDefaults: { mode: 'Light' },
      nodes: {},
    };
    for (const [path, target] of [
      ['a', 'b'],
      ['b', 'c'],
      ['c', 'a'],
    ] as const) {
      graph.nodes[path] = {
        baselineValue: { $value: `#${path}${path}${path}`, $type: 'color' },
        baselineKind: 'alias',
        baselineAliasTarget: target,
        writes: {},
        affectedBy: ['mode'],
        aliases: [target],
        aliasedBy: [],
      };
    }
    expect(() => resolveAt(graph, 'a', { mode: 'Dark' })).not.toThrow();
  });

  it('resolveAliasAt terminates when a partial-alias write field aliases back to the source path', () => {
    // Path A is a partial-alias write at mode=Dark: its `color` field
    // aliases path B. Path B is an alias to A — closing the cycle.
    // resolveAliasAt must not stack-overflow; it should return the baseline value.
    const graph: TokenGraph = {
      axes: ['mode'],
      axisDefaults: { mode: 'Light' },
      axisContexts: { mode: ['Light', 'Dark'] },
      nodes: {
        a: {
          baselineValue: {
            $value: { color: '#aaa', width: '1px' },
            $type: 'border',
          },
          baselineKind: 'literal',
          writes: {
            mode: {
              Dark: {
                kind: 'partial-alias',
                baseValue: { $value: { color: '#aaa', width: '1px' }, $type: 'border' },
                aliasFields: { color: 'b' },
              },
            },
          },
          affectedBy: ['mode'],
          aliases: [],
          aliasedBy: ['b'],
        },
        b: {
          baselineValue: { $value: '#bbb', $type: 'color' },
          baselineKind: 'alias',
          baselineAliasTarget: 'a',
          writes: {},
          affectedBy: ['mode'],
          aliases: ['a'],
          aliasedBy: ['a'],
        },
      },
    };
    expect(() => resolveAliasAt(graph, 'a', { mode: 'Dark' })).not.toThrow();
  });
});
