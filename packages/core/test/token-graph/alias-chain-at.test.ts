import { expect, it } from 'vitest';
import type { TokenGraph } from '#/token-graph/types.ts';
import { aliasChainAt } from '#/token-graph/walk.ts';

function graph(): TokenGraph {
  return {
    axes: ['mode'],
    axisDefaults: { mode: 'Light' },
    axisContexts: { mode: ['Light', 'Dark'] },
    nodes: {
      'palette.0': { baselineValue: { $value: '#fff', $type: 'color' }, baselineKind: 'literal', writes: {}, affectedBy: [], aliases: [], aliasedBy: ['surface'] },
      'palette.9': { baselineValue: { $value: '#000', $type: 'color' }, baselineKind: 'literal', writes: {}, affectedBy: [], aliases: [], aliasedBy: ['surface'] },
      'blue.5': { baselineValue: { $value: '#00f', $type: 'color' }, baselineKind: 'literal', writes: {}, affectedBy: [], aliases: [], aliasedBy: ['brand'] },
      surface: {
        baselineValue: { $value: '#fff', $type: 'color', aliasOf: 'palette.0', aliasChain: ['palette.0'] },
        baselineKind: 'alias',
        baselineAliasTarget: 'palette.0',
        writes: { mode: { Dark: { kind: 'alias', target: 'palette.9' } } },
        affectedBy: ['mode'],
        aliases: ['palette.0'],
        aliasedBy: [],
      },
      brand: {
        baselineValue: { $value: '#00f', $type: 'color', aliasOf: 'blue.5', aliasChain: ['blue.5'] },
        baselineKind: 'alias',
        baselineAliasTarget: 'blue.5',
        writes: {},
        affectedBy: [],
        aliases: ['blue.5'],
        aliasedBy: ['text'],
      },
      text: {
        baselineValue: { $value: '#00f', $type: 'color', aliasOf: 'brand', aliasChain: ['brand', 'blue.5'] },
        baselineKind: 'alias',
        baselineAliasTarget: 'brand',
        writes: {},
        affectedBy: [],
        aliases: ['brand'],
        aliasedBy: [],
      },
    },
  };
}

it('varying alias: chain points at the per-tuple target', () => {
  expect(aliasChainAt(graph(), 'surface', { mode: 'Light' })).toEqual(['palette.0']);
  expect(aliasChainAt(graph(), 'surface', { mode: 'Dark' })).toEqual(['palette.9']);
});

it('constant alias: full multi-hop chain to the leaf', () => {
  expect(aliasChainAt(graph(), 'text', { mode: 'Light' })).toEqual(['brand', 'blue.5']);
});

it('literal: empty chain', () => {
  expect(aliasChainAt(graph(), 'palette.0', { mode: 'Light' })).toEqual([]);
});

it('cycle-safe: stops on a repeated target', () => {
  const g = graph();
  g.nodes['blue.5'] = { ...g.nodes['blue.5']!, baselineKind: 'alias', baselineAliasTarget: 'brand', aliases: ['brand'] };
  const chain = aliasChainAt(g, 'brand', { mode: 'Light' });
  expect(chain.length).toBeLessThan(10);
  expect(new Set(chain).size).toBe(chain.length);
});
