import { describe, expect, it } from 'vitest';
import { buildTokenGraph } from '#/token-graph/build.ts';
import { getAffectedBy, getVariance, listPaths } from '#/token-graph/queries.ts';
import { loadReferenceFixtureParserInput } from '../_helpers.ts';

describe('token-graph derived queries', () => {
  it('getAffectedBy returns the same array as node.affectedBy', async () => {
    const { parserInput, axes, defaultTuple } = await loadReferenceFixtureParserInput();
    const { graph } = buildTokenGraph(parserInput, axes, defaultTuple);
    expect(getAffectedBy(graph, 'color.accent.bg')).toEqual(
      graph.nodes['color.accent.bg']?.affectedBy,
    );
  });

  it('getAffectedBy returns empty for unknown paths', async () => {
    const { parserInput, axes, defaultTuple } = await loadReferenceFixtureParserInput();
    const { graph } = buildTokenGraph(parserInput, axes, defaultTuple);
    expect(getAffectedBy(graph, 'this.does.not.exist')).toEqual([]);
  });

  it('getVariance returns "constant" for tokens with empty affectedBy', async () => {
    const { parserInput, axes, defaultTuple } = await loadReferenceFixtureParserInput();
    const { graph } = buildTokenGraph(parserInput, axes, defaultTuple);
    const constantPath = Object.entries(graph.nodes).find(
      ([, n]) => n.affectedBy.length === 0,
    )?.[0];
    expect(constantPath).toBeDefined();
    const variance = getVariance(graph, constantPath!);
    expect(variance.kind).toBe('constant');
    expect(variance.varyingAxes).toEqual([]);
    expect(variance.constantAcrossAxes).toEqual(graph.axes);
  });

  it('getVariance returns "single" for single-axis variance', async () => {
    const { parserInput, axes, defaultTuple } = await loadReferenceFixtureParserInput();
    const { graph } = buildTokenGraph(parserInput, axes, defaultTuple);
    const singlePath = Object.entries(graph.nodes).find(([, n]) => n.affectedBy.length === 1)?.[0];
    expect(singlePath).toBeDefined();
    const variance = getVariance(graph, singlePath!);
    expect(variance.kind).toBe('single');
    if (variance.kind === 'single') {
      expect(variance.axis).toBe(graph.nodes[singlePath!]?.affectedBy[0]);
      expect(variance.varyingAxes).toHaveLength(1);
    }
  });

  it('getVariance returns "multi" for two-or-more axis variance', async () => {
    const { parserInput, axes, defaultTuple } = await loadReferenceFixtureParserInput();
    const { graph } = buildTokenGraph(parserInput, axes, defaultTuple);
    const multiPath = Object.entries(graph.nodes).find(([, n]) => n.affectedBy.length >= 2)?.[0];
    expect(multiPath).toBeDefined();
    const variance = getVariance(graph, multiPath!);
    expect(variance.kind).toBe('multi');
    expect(variance.varyingAxes.length).toBeGreaterThanOrEqual(2);
  });

  it('getVariance populates perAxis.contexts with stringified values for every context', async () => {
    const { parserInput, axes, defaultTuple } = await loadReferenceFixtureParserInput();
    const { graph } = buildTokenGraph(parserInput, axes, defaultTuple);
    const variance = getVariance(graph, 'color.accent.bg');
    for (const axis of graph.axes) {
      const perAxis = variance.perAxis[axis];
      expect(perAxis, `${axis} should be in perAxis`).toBeDefined();
      for (const ctx of graph.axisContexts[axis]!) {
        expect(
          perAxis!.contexts[ctx],
          `perAxis.${axis}.contexts.${ctx} should be defined`,
        ).toBeDefined();
      }
    }
  });

  it('listPaths returns sorted union of all paths', async () => {
    const { parserInput, axes, defaultTuple } = await loadReferenceFixtureParserInput();
    const { graph } = buildTokenGraph(parserInput, axes, defaultTuple);
    const paths = listPaths(graph);
    expect(paths).toEqual([...paths].toSorted());
    expect(paths.length).toBe(Object.keys(graph.nodes).length);
  });
});
