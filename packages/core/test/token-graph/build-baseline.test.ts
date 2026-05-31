import { describe, expect, it } from 'vitest';
import { buildTokenGraph } from '#/token-graph/build.ts';
import { loadReferenceFixtureParserInput } from '../_helpers.ts';

describe('buildTokenGraph baseline seeding', () => {
  it('creates one node per baseline path with literal baselineKind for leaf tokens', async () => {
    const { parserInput, axes, defaultTuple } = await loadReferenceFixtureParserInput();
    const { graph } = buildTokenGraph(parserInput, axes, defaultTuple);
    const blueLeaf = graph.nodes['color.palette.blue.500'];
    expect(blueLeaf).toBeDefined();
    expect(blueLeaf?.baselineKind).toBe('literal');
    expect(blueLeaf?.baselineValue.$value).toBeDefined();
  });

  it('marks alias tokens with baselineKind=alias and target path', async () => {
    const { parserInput, axes, defaultTuple } = await loadReferenceFixtureParserInput();
    const { graph } = buildTokenGraph(parserInput, axes, defaultTuple);
    const accentBg = graph.nodes['color.accent.bg'];
    expect(accentBg?.baselineKind).toBe('alias');
    expect(accentBg?.baselineAliasTarget).toBeDefined();
  });

  it('seeds writes from each non-default singleton', async () => {
    const { parserInput, axes, defaultTuple } = await loadReferenceFixtureParserInput();
    const { graph } = buildTokenGraph(parserInput, axes, defaultTuple);
    expect(graph.nodes['color.accent.bg']?.writes['mode']?.['Dark']).toMatchObject({
      kind: 'alias',
    });
  });

  it('every node has a defined baselineValue', async () => {
    const { parserInput, axes, defaultTuple } = await loadReferenceFixtureParserInput();
    const { graph } = buildTokenGraph(parserInput, axes, defaultTuple);
    for (const [path, node] of Object.entries(graph.nodes)) {
      expect(node.baselineValue.$value, `${path} has undefined $value`).toBeDefined();
    }
  });

  it('returns axis-ordered axes + defaults', async () => {
    const { parserInput, axes, defaultTuple } = await loadReferenceFixtureParserInput();
    const { graph } = buildTokenGraph(parserInput, axes, defaultTuple);
    expect(graph.axes).toEqual(axes.map((a) => a.name));
    expect(graph.axisDefaults).toEqual({ mode: 'Light', brand: 'Default', contrast: 'Normal' });
  });
});
