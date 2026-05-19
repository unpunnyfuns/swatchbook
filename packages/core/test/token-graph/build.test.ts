import { describe, expect, it } from 'vitest';
import { buildTokenGraph, extractWritesFromModifiers } from '#/token-graph/build.ts';
import type { Axis } from '#/types.ts';
import { loadReferenceFixtureParserInput } from '../_helpers.ts';

describe('extractWritesFromModifiers', () => {
  it('extracts literal writes', () => {
    const modifiers = {
      mode: {
        contexts: {
          Dark: [{ color: { fg: { $value: '#fff', $type: 'color' } } }],
        },
        default: 'Light',
      },
    };
    const axes: Axis[] = [
      { name: 'mode', contexts: ['Light', 'Dark'], default: 'Light', source: 'resolver' },
    ];
    const writes = extractWritesFromModifiers(modifiers, axes);
    expect(writes['color.fg']?.mode?.Dark).toEqual({
      kind: 'literal',
      value: { $value: '#fff', $type: 'color' },
    });
  });

  it('extracts alias writes', () => {
    const modifiers = {
      mode: {
        contexts: {
          Dark: [{ color: { fg: { $value: '{color.palette.gray.0}' } } }],
        },
        default: 'Light',
      },
    };
    const axes: Axis[] = [
      { name: 'mode', contexts: ['Light', 'Dark'], default: 'Light', source: 'resolver' },
    ];
    const writes = extractWritesFromModifiers(modifiers, axes);
    expect(writes['color.fg']?.mode?.Dark).toEqual({
      kind: 'alias',
      target: 'color.palette.gray.0',
    });
  });

  it('extracts partial-alias writes for composite types', () => {
    const modifiers = {
      brand: {
        contexts: {
          BrandA: [
            {
              border: {
                default: {
                  $type: 'border',
                  $value: { width: '2px', style: 'solid', color: '{color.brand.a}' },
                },
              },
            },
          ],
        },
        default: 'Default',
      },
    };
    const axes: Axis[] = [
      { name: 'brand', contexts: ['Default', 'BrandA'], default: 'Default', source: 'resolver' },
    ];
    const writes = extractWritesFromModifiers(modifiers, axes);
    expect(writes['border.default']?.brand?.BrandA).toMatchObject({
      kind: 'partial-alias',
      aliasFields: { color: 'color.brand.a' },
    });
  });

  it('skips default contexts', () => {
    const modifiers = {
      mode: {
        contexts: {
          Light: [{ color: { fg: { $value: '#000' } } }],
        },
        default: 'Light',
      },
    };
    const axes: Axis[] = [
      { name: 'mode', contexts: ['Light'], default: 'Light', source: 'resolver' },
    ];
    const writes = extractWritesFromModifiers(modifiers, axes);
    expect(writes).toEqual({});
  });

  it('returns empty object for modifiers with no contexts', () => {
    const modifiers = {
      mode: { default: 'Light' },
    };
    const axes: Axis[] = [
      { name: 'mode', contexts: ['Light'], default: 'Light', source: 'resolver' },
    ];
    const writes = extractWritesFromModifiers(modifiers, axes);
    expect(writes).toEqual({});
  });

  it('extracts partial-alias writes for gradient composites with array stops', () => {
    const modifiers = {
      brand: {
        contexts: {
          BrandA: [
            {
              gradient: {
                hero: {
                  $type: 'gradient',
                  $value: [
                    { color: '{color.brand.a}', position: 0 },
                    { color: '{color.brand.b}', position: 1 },
                  ],
                },
              },
            },
          ],
        },
        default: 'Default',
      },
    };
    const axes: Axis[] = [
      { name: 'brand', contexts: ['Default', 'BrandA'], default: 'Default', source: 'resolver' },
    ];
    const writes = extractWritesFromModifiers(modifiers, axes);
    const write = writes['gradient.hero']?.brand?.BrandA;
    expect(write?.kind).toBe('partial-alias');
    if (write?.kind === 'partial-alias') {
      expect(write.aliasFields).toEqual({
        '0.color': 'color.brand.a',
        '1.color': 'color.brand.b',
      });
      expect(write.baseValue.$value).toEqual([{ position: 0 }, { position: 1 }]);
    }
  });

  it('handles axes missing from modifiers (no contribution)', () => {
    const modifiers = {
      mode: {
        contexts: { Dark: [{ a: { $value: '#000' } }] },
        default: 'Light',
      },
    };
    // axes includes 'brand' which has no modifier — should not crash
    const axes: Axis[] = [
      { name: 'mode', contexts: ['Light', 'Dark'], default: 'Light', source: 'resolver' },
      { name: 'brand', contexts: ['Default'], default: 'Default', source: 'resolver' },
    ];
    const writes = extractWritesFromModifiers(modifiers, axes);
    expect(writes['a']?.mode?.Dark).toEqual({ kind: 'literal', value: { $value: '#000' } });
    expect(writes['a']?.brand).toBeUndefined();
  });
});

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

describe('affectedBy fixpoint', () => {
  it('marks direct write axes as affecting', async () => {
    const { parserInput, axes, defaultTuple } = await loadReferenceFixtureParserInput();
    const { graph } = buildTokenGraph(parserInput, axes, defaultTuple);
    // color.accent.bg is directly written by `mode` (Dark) and `brand` (BrandA) in the reference fixture
    expect(graph.nodes['color.accent.bg']?.affectedBy).toEqual(
      expect.arrayContaining(['mode', 'brand']),
    );
  });

  it('propagates affectedBy backward through alias edges', async () => {
    const { parserInput, axes, defaultTuple } = await loadReferenceFixtureParserInput();
    const { graph } = buildTokenGraph(parserInput, axes, defaultTuple);
    // color.accent.fg is an alias; its target gets axis writes, so fg.affectedBy includes those axes
    expect(graph.nodes['color.accent.fg']?.affectedBy.length).toBeGreaterThan(0);
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
