import { describe, expect, it } from 'vitest';
import {
  buildTokenGraph,
  buildTokenGraphFromLayered,
  computeAffectedBy,
  extractWritesFromModifiers,
} from '#/token-graph/build.ts';
import type { Axis } from '#/types.ts';
import type { TokenGraphNode } from '#/token-graph/types.ts';
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
      expect(write.baseValue.$value).toEqual([
        { color: '{color.brand.a}', position: 0 },
        { color: '{color.brand.b}', position: 1 },
      ]);
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

  it('substitutes $ref objects in modifier values against the refLookup token map', () => {
    // The consumer-reported failure mode: a modifier writes a color with
    // `components: { $ref: '#/primitives/.../components' }`. Without
    // substitution, the raw $ref object reaches the walker and crashes
    // colorjs.io at emit. With refLookup, the substituted array is what
    // gets stored as the write's value.
    const refLookup = {
      'primitives.color.gray.12': {
        $type: 'color' as const,
        $value: { colorSpace: 'srgb', components: [0.5, 0.5, 0.5], alpha: 1 },
      },
    };
    const modifiers = {
      'color-mode': {
        contexts: {
          dark: [
            {
              semantics: {
                color: {
                  emphasis: {
                    accent: {
                      base: {
                        active: {
                          $type: 'color',
                          $value: {
                            colorSpace: 'oklch',
                            alpha: 0.6,
                            components: { $ref: '#/primitives/color/gray/12/$value/components' },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          ],
        },
        default: 'light',
      },
    };
    const axes: Axis[] = [
      {
        name: 'color-mode',
        contexts: ['light', 'dark'],
        default: 'light',
        source: 'resolver',
      },
    ];
    const writes = extractWritesFromModifiers(modifiers, axes, refLookup);
    const write = writes['semantics.color.emphasis.accent.base.active']?.['color-mode']?.dark;
    expect(write?.kind).toBe('literal');
    if (write?.kind === 'literal') {
      const $value = write.value.$value as { components: unknown };
      expect($value.components).toEqual([0.5, 0.5, 0.5]);
    }
  });

  it('leaves $ref objects intact when the target is missing from refLookup', () => {
    const modifiers = {
      mode: {
        contexts: {
          Dark: [
            {
              c: {
                $type: 'color',
                $value: {
                  colorSpace: 'srgb',
                  alpha: 1,
                  components: { $ref: '#/nonexistent/path' },
                },
              },
            },
          ],
        },
        default: 'Light',
      },
    };
    const axes: Axis[] = [
      { name: 'mode', contexts: ['Light', 'Dark'], default: 'Light', source: 'resolver' },
    ];
    const writes = extractWritesFromModifiers(modifiers, axes, {});
    const write = writes['c']?.mode?.Dark;
    expect(write?.kind).toBe('literal');
    if (write?.kind === 'literal') {
      const $value = write.value.$value as { components: unknown };
      expect($value.components).toEqual({ $ref: '#/nonexistent/path' });
    }
  });

  it('inherits $type from a parent group node when the leaf lacks its own', () => {
    // Modifier source where `border` group declares $type, and child leaves
    // (`default`) carry only $value. Without inheritance, toWriteValue can't
    // detect alias sub-fields and would classify as 'literal'.
    const modifiers = {
      contrast: {
        contexts: {
          High: [
            {
              border: {
                $type: 'border',
                default: {
                  $value: { color: '{color.border.default}', width: '2px', style: 'solid' },
                },
              },
            },
          ],
        },
        default: 'Normal',
      },
    };
    const axes: Axis[] = [
      { name: 'contrast', contexts: ['Normal', 'High'], default: 'Normal', source: 'resolver' },
    ];
    const writes = extractWritesFromModifiers(modifiers, axes);
    expect(writes['border.default']?.contrast?.High?.kind).toBe('partial-alias');
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

describe('diagnostic emission', () => {
  it('reference fixture emits no diagnostics', async () => {
    const { parserInput, axes, defaultTuple } = await loadReferenceFixtureParserInput();
    const { diagnostics } = buildTokenGraph(parserInput, axes, defaultTuple);
    expect(diagnostics).toHaveLength(0);
  });

  it('emits unresolvableAliasDiagnostic for a write that aliases a nonexistent path', () => {
    const axes: Axis[] = [
      { name: 'mode', contexts: ['Light', 'Dark'], default: 'Light', source: 'resolver' },
    ];
    const baseline = {
      'color.fg': { $value: '#000', $type: 'color' },
    };
    // permutationID({ mode: 'Dark' }) = 'Dark'
    const perSingletonResolved = {
      Dark: {
        'color.fg': { $value: '#fff', $type: 'color', aliasOf: 'does.not.exist' },
      },
    };
    const defaultTuple = { mode: 'Light' };
    const { diagnostics } = buildTokenGraphFromLayered(axes, baseline, perSingletonResolved, defaultTuple);
    expect(
      diagnostics.some(
        (d) => d.group === 'swatchbook/token-graph' && d.message.includes('does.not.exist'),
      ),
    ).toBe(true);
  });

  it('emits aliasCycleDiagnostic for a baseline cycle (A aliases B aliases A)', () => {
    const axes: Axis[] = [];
    const baseline = {
      A: { $value: '#000', $type: 'color', aliasOf: 'B' },
      B: { $value: '#000', $type: 'color', aliasOf: 'A' },
    };
    const { diagnostics } = buildTokenGraphFromLayered(axes, baseline, {}, {});
    expect(
      diagnostics.some(
        (d) =>
          d.group === 'swatchbook/token-graph' &&
          d.severity === 'warn' &&
          (d.message.includes('A') || d.message.includes('B')),
      ),
    ).toBe(true);
  });

  it('does not emit unresolvableAliasDiagnostic when the target exists in the graph', () => {
    const axes: Axis[] = [
      { name: 'mode', contexts: ['Light', 'Dark'], default: 'Light', source: 'resolver' },
    ];
    const baseline = {
      'color.fg': { $value: '#000', $type: 'color' },
      'color.palette.white': { $value: '#fff', $type: 'color' },
    };
    // permutationID({ mode: 'Dark' }) = 'Dark'
    const perSingletonResolved = {
      Dark: {
        'color.fg': { $value: '#fff', $type: 'color', aliasOf: 'color.palette.white' },
        'color.palette.white': { $value: '#fff', $type: 'color' },
      },
    };
    const defaultTuple = { mode: 'Light' };
    const { diagnostics } = buildTokenGraphFromLayered(axes, baseline, perSingletonResolved, defaultTuple);
    expect(diagnostics).toHaveLength(0);
  });

  it('emits malformedColorShapeDiagnostic when a color token has object $value with no components', () => {
    const axes: Axis[] = [];
    const baseline = {
      'color.broken': {
        $type: 'color',
        $value: { colorSpace: 'srgb', alpha: 0.5 },
      },
    };
    const { diagnostics } = buildTokenGraphFromLayered(axes, baseline, {}, {});
    const match = diagnostics.find(
      (d) =>
        d.group === 'swatchbook/token-graph' &&
        d.severity === 'warn' &&
        d.message.includes('color.broken') &&
        d.message.includes('components'),
    );
    expect(match).toBeDefined();
  });

  it('emits malformedColorShapeDiagnostic for object components on a color token', () => {
    const axes: Axis[] = [];
    const baseline = {
      'color.broken': {
        $type: 'color',
        $value: { colorSpace: 'srgb', components: { r: 1, g: 0, b: 0 } as unknown as number[] },
      },
    };
    const { diagnostics } = buildTokenGraphFromLayered(axes, baseline, {}, {});
    const match = diagnostics.find(
      (d) =>
        d.group === 'swatchbook/token-graph' &&
        d.message.includes('color.broken') &&
        d.message.includes('must be an array'),
    );
    expect(match).toBeDefined();
  });

  it('emits malformedColorShapeDiagnostic for a malformed color sub-field in a border token', () => {
    const axes: Axis[] = [];
    const baseline = {
      'border.thin': {
        $type: 'border',
        $value: {
          color: { colorSpace: 'srgb', alpha: 1 },
          style: 'solid',
          width: '1px',
        },
      },
    };
    const { diagnostics } = buildTokenGraphFromLayered(axes, baseline, {}, {});
    const match = diagnostics.find(
      (d) =>
        d.group === 'swatchbook/token-graph' &&
        d.message.includes('border.thin') &&
        d.message.includes('color') &&
        d.message.includes('components'),
    );
    expect(match).toBeDefined();
  });

  it('does not emit malformedColorShapeDiagnostic for a well-formed color token', () => {
    const axes: Axis[] = [];
    const baseline = {
      'color.ok': {
        $type: 'color',
        $value: { colorSpace: 'srgb', components: [1, 0, 0], alpha: 1 },
      },
      'color.string-form': {
        $type: 'color',
        $value: '#ff0000',
      },
    };
    const { diagnostics } = buildTokenGraphFromLayered(axes, baseline, {}, {});
    const colorShapeDiags = diagnostics.filter((d) => d.message.includes('structurally invalid'));
    expect(colorShapeDiags).toHaveLength(0);
  });

  it('emits unresolvedRefDiagnostic when color components carry an unresolved $ref object', () => {
    const axes: Axis[] = [];
    const baseline = {
      'color.via-ref': {
        $type: 'color',
        $value: {
          colorSpace: 'srgb',
          components: { $ref: '#/primitives/color/gray/12/$value/components' } as unknown as number[],
          alpha: 1,
        },
      },
    };
    const { diagnostics } = buildTokenGraphFromLayered(axes, baseline, {}, {});
    const match = diagnostics.find(
      (d) =>
        d.group === 'swatchbook/token-graph' &&
        d.severity === 'warn' &&
        d.message.includes('Unresolved `$ref`') &&
        d.message.includes('color.via-ref') &&
        d.message.includes('#/primitives/color/gray/12/$value/components'),
    );
    expect(match).toBeDefined();

    // The generic "must be an array" diagnostic should NOT also fire — the
    // $ref-specific message replaces it.
    const generic = diagnostics.filter((d) => d.message.includes('must be an array of numbers'));
    expect(generic).toHaveLength(0);
  });

  it('still emits generic malformedColorShapeDiagnostic for non-$ref non-array components', () => {
    const axes: Axis[] = [];
    const baseline = {
      'color.bad-shape': {
        $type: 'color',
        $value: {
          colorSpace: 'srgb',
          components: { r: 1, g: 0, b: 0 } as unknown as number[],
          alpha: 1,
        },
      },
    };
    const { diagnostics } = buildTokenGraphFromLayered(axes, baseline, {}, {});
    const match = diagnostics.find(
      (d) =>
        d.group === 'swatchbook/token-graph' &&
        d.message.includes('color.bad-shape') &&
        d.message.includes('must be an array of numbers'),
    );
    expect(match).toBeDefined();
  });
});
