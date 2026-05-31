import { describe, expect, it } from 'vitest';
import { buildTokenGraph, computeAffectedBy } from '#/token-graph/build.ts';
import type { TokenGraphNode } from '#/token-graph/types.ts';
import { loadReferenceFixtureParserInput } from '../_helpers.ts';

describe('affectedBy fixpoint', () => {
  it('marks direct write axes as affecting', async () => {
    const { parserInput, axes, defaultTuple } = await loadReferenceFixtureParserInput();
    const { graph } = buildTokenGraph(parserInput, axes, defaultTuple);
    // color.accent.bg is directly written by `mode` (Dark) and `brand` (BrandA) in the reference fixture
    expect(graph.nodes['color.accent.bg']?.affectedBy).toEqual(
      expect.arrayContaining(['mode', 'brand']),
    );
  });

  it('propagates affectedBy from alias target to source through transitive chain', () => {
    // Synthetic graph: A aliases B aliases C. Only C has a direct write.
    // Expectation: A.affectedBy and B.affectedBy both include the axis that
    // writes C.
    const nodes: Record<string, TokenGraphNode> = {
      A: {
        baselineValue: { $value: '#000' },
        baselineKind: 'alias',
        baselineAliasTarget: 'B',
        writes: {},
        affectedBy: [],
        aliases: ['B'],
        aliasedBy: [],
      },
      B: {
        baselineValue: { $value: '#000' },
        baselineKind: 'alias',
        baselineAliasTarget: 'C',
        writes: {},
        affectedBy: [],
        aliases: ['C'],
        aliasedBy: [],
      },
      C: {
        baselineValue: { $value: '#000' },
        baselineKind: 'literal',
        writes: { mode: { Dark: { kind: 'literal', value: { $value: '#fff' } } } },
        affectedBy: [],
        aliases: [],
        aliasedBy: [],
      },
    };
    computeAffectedBy(nodes, ['mode']);
    expect(nodes.A!.affectedBy).toEqual(['mode']);
    expect(nodes.B!.affectedBy).toEqual(['mode']);
    expect(nodes.C!.affectedBy).toEqual(['mode']);
  });

  it('populates aliasedBy from write-introduced aliases (not just baseline)', () => {
    // X has no baseline alias; X's mode=Dark write aliases Y.
    // Expectation: Y.aliasedBy includes X.
    const nodes: Record<string, TokenGraphNode> = {
      X: {
        baselineValue: { $value: '#000' },
        baselineKind: 'literal',
        writes: { mode: { Dark: { kind: 'alias', target: 'Y' } } },
        affectedBy: [],
        aliases: [],
        aliasedBy: [],
      },
      Y: {
        baselineValue: { $value: '#fff' },
        baselineKind: 'literal',
        writes: {},
        affectedBy: [],
        aliases: [],
        aliasedBy: [],
      },
    };
    computeAffectedBy(nodes, ['mode']);
    expect(nodes.Y!.aliasedBy).toContain('X');
  });

  it('returns affectedBy sorted by project axis order', async () => {
    const { parserInput, axes, defaultTuple } = await loadReferenceFixtureParserInput();
    const { graph } = buildTokenGraph(parserInput, axes, defaultTuple);
    for (const node of Object.values(graph.nodes)) {
      const indexes = node.affectedBy.map((a) => graph.axes.indexOf(a));
      for (let i = 1; i < indexes.length; i++) {
        expect(indexes[i]).toBeGreaterThan(indexes[i - 1]!);
      }
    }
  });

  it('populates aliasedBy as the reverse of aliases', async () => {
    const { parserInput, axes, defaultTuple } = await loadReferenceFixtureParserInput();
    const { graph } = buildTokenGraph(parserInput, axes, defaultTuple);
    for (const [path, node] of Object.entries(graph.nodes)) {
      for (const target of node.aliases) {
        const targetNode = graph.nodes[target];
        expect(targetNode?.aliasedBy, `${target} should have ${path} in aliasedBy`).toContain(path);
      }
    }
  });

  it('constant tokens have empty affectedBy', async () => {
    const { parserInput, axes, defaultTuple } = await loadReferenceFixtureParserInput();
    const { graph } = buildTokenGraph(parserInput, axes, defaultTuple);
    // Find any token unaffected by any axis (likely a palette primitive)
    const constants = Object.entries(graph.nodes).filter(([, n]) => n.affectedBy.length === 0);
    expect(constants.length).toBeGreaterThan(0);
  });
});
