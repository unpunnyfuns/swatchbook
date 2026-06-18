import { describe, expect, it } from 'vitest';
import type { TokenGraph } from '#/token-graph/types.ts';
import { resolveAllAt, resolveAllWithProvenanceAt } from '#/token-graph/walk.ts';

function graph(): TokenGraph {
  return {
    axes: ['mode'],
    axisDefaults: { mode: 'Light' },
    axisContexts: { mode: ['Light', 'Dark'] },
    nodes: {
      'palette.0': { baselineValue: { $value: '#fff', $type: 'color' }, baselineKind: 'literal', writes: {}, affectedBy: [], aliases: [], aliasedBy: ['surface'] },
      'palette.9': { baselineValue: { $value: '#000', $type: 'color' }, baselineKind: 'literal', writes: {}, affectedBy: [], aliases: [], aliasedBy: ['surface'] },
      surface: {
        baselineValue: { $value: '#fff', $type: 'color', aliasOf: 'palette.0', aliasChain: ['palette.0'], aliasedBy: ['legacy.global'] },
        baselineKind: 'alias',
        baselineAliasTarget: 'palette.0',
        writes: { mode: { Dark: { kind: 'alias', target: 'palette.9' } } },
        affectedBy: ['mode'],
        aliases: ['palette.0'],
        aliasedBy: ['button.bg'],
      },
    },
  };
}

describe('resolveAllWithProvenanceAt', () => {
  it("varying alias in the non-default tuple keeps its own forward chain (not the target's)", () => {
    const dark = resolveAllWithProvenanceAt(graph(), { mode: 'Dark' });
    expect(dark['surface']?.aliasChain).toEqual(['palette.9']);
    expect(dark['surface']?.aliasOf).toBe('palette.9');
  });

  it('$value matches resolveAllAt (the leaf), unchanged', () => {
    const dark = resolveAllWithProvenanceAt(graph(), { mode: 'Dark' });
    const leaf = resolveAllAt(graph(), { mode: 'Dark' });
    expect(dark['surface']?.$value).toEqual(leaf['surface']?.$value);
  });

  it('aliasedBy is the graph node structural union, not the parser-global baseline field', () => {
    const dark = resolveAllWithProvenanceAt(graph(), { mode: 'Dark' });
    expect(dark['surface']?.aliasedBy).toEqual(['button.bg']);
    expect(dark['palette.9']?.aliasedBy).toEqual(['surface']);
  });

  it('literal has no forward chain', () => {
    const dark = resolveAllWithProvenanceAt(graph(), { mode: 'Dark' });
    expect(dark['palette.9']?.aliasChain ?? []).toEqual([]);
    expect(dark['palette.9']?.aliasOf).toBeUndefined();
  });
});
