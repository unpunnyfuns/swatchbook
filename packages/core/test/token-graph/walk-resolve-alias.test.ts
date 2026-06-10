import { describe, expect, it } from 'vitest';
import type { TokenGraph } from '#/token-graph/types.ts';
import { buildTokenGraph } from '#/token-graph/build.ts';
import { resolveAliasAllAt, resolveAliasAt, resolveAllAt, resolveAt } from '#/token-graph/walk.ts';
import { loadReferenceFixtureParserInput } from '../_helpers.ts';

// Minimal graph exercising writes over metadata-carrying baselines.
// Alias-kind baselineValues retain aliasOf/aliasChain (SLIM_KEYS keeps them),
// and Terrazzo's transforms route on that metadata before $value — so a write
// that changes the token's structure must not let the baseline's metadata
// survive into the resolved view.
function graphWithMetadataBaselines(): TokenGraph {
  return {
    axes: ['mode'],
    axisDefaults: { mode: 'Light' },
    nodes: {
      'color.a': {
        baselineValue: { $value: '#00aa00', $type: 'color' },
        baselineKind: 'literal',
        writes: {},
        affectedBy: [],
        aliases: [],
        aliasedBy: ['color.text'],
      },
      'color.text': {
        baselineValue: {
          $value: '#000000',
          $type: 'color',
          aliasOf: 'color.a',
          aliasChain: ['color.a'],
        },
        baselineKind: 'alias',
        baselineAliasTarget: 'color.a',
        writes: {
          mode: {
            Dark: { kind: 'literal', value: { $value: '#ffffff', $type: 'color' } },
          },
        },
        affectedBy: ['mode'],
        aliases: ['color.a'],
        aliasedBy: [],
      },
      'border.focus': {
        baselineValue: {
          $value: { color: '#000000', width: '1px' },
          $type: 'border',
          aliasOf: 'border.base',
          aliasChain: ['border.base'],
        },
        baselineKind: 'alias',
        baselineAliasTarget: 'border.base',
        writes: {
          mode: {
            Dark: {
              kind: 'partial-alias',
              baseValue: { $value: { color: '#000000', width: '2px' }, $type: 'border' },
              aliasFields: { color: 'color.a' },
            },
          },
        },
        affectedBy: ['mode'],
        aliases: ['border.base'],
        aliasedBy: [],
      },
      'border.base': {
        baselineValue: { $value: { color: '#000000', width: '1px' }, $type: 'border' },
        baselineKind: 'literal',
        writes: {},
        affectedBy: [],
        aliases: [],
        aliasedBy: ['border.focus'],
      },
      'border.input': {
        baselineValue: {
          $value: { color: '#000000', width: '1px' },
          $type: 'border',
          partialAliasOf: { color: 'color.a' },
        },
        baselineKind: 'partial-alias',
        baselinePartialFields: { color: 'color.a' },
        writes: {
          mode: {
            Dark: {
              kind: 'literal',
              value: { $value: { color: '#ffffff', width: '1px' }, $type: 'border' },
            },
          },
        },
        affectedBy: ['mode'],
        aliases: [],
        aliasedBy: [],
      },
      'color.ring': {
        baselineValue: {
          $value: { color: '#000000', width: '1px' },
          $type: 'border',
          partialAliasOf: { color: 'color.a' },
        },
        baselineKind: 'partial-alias',
        baselinePartialFields: { color: 'color.a' },
        writes: {
          mode: {
            Dark: { kind: 'alias', target: 'border.base' },
          },
        },
        affectedBy: ['mode'],
        aliases: [],
        aliasedBy: [],
      },
    },
  };
}

describe('resolveAliasAt / resolveAliasAllAt alias-preserving walker', () => {
  it('resolveAliasAllAt returns alias-preserving tokens for every path in the graph', async () => {
    const { parserInput, axes, defaultTuple } = await loadReferenceFixtureParserInput();
    const { graph } = buildTokenGraph(parserInput, axes, defaultTuple);
    const tuple = { ...defaultTuple, mode: 'Dark' };
    const result = resolveAliasAllAt(graph, tuple);
    expect(Object.keys(result).length).toBe(Object.keys(graph.nodes).length);
    // Spot-check: alias token preserves aliasOf
    expect(result['color.accent.bg']?.aliasOf).toBeDefined();
    // Literal token has no aliasOf
    expect(result['color.palette.blue.500']?.aliasOf).toBeUndefined();
  });

  it('alias-preserving view differs from leaf view on aliased tokens at a non-default tuple', async () => {
    const { parserInput, axes, defaultTuple } = await loadReferenceFixtureParserInput();
    const { graph } = buildTokenGraph(parserInput, axes, defaultTuple);
    // Use Dark tuple so color.accent.bg has a write-introduced alias (not baseline fast-path).
    // resolveAt follows alias write to the leaf — returns literal with no aliasOf.
    // resolveAliasAt stops at the alias write and preserves aliasOf.
    const darkTuple = { ...defaultTuple, mode: 'Dark' };
    const aliasView = resolveAliasAllAt(graph, darkTuple);
    const leafView = resolveAllAt(graph, darkTuple);
    // aliasView's aliased tokens carry aliasOf; leafView's don't
    expect(aliasView['color.accent.bg']?.aliasOf).toBeDefined();
    expect(leafView['color.accent.bg']?.aliasOf).toBeUndefined();
    // Both have the same $value (leaf value)
    expect(aliasView['color.accent.bg']?.$value).toEqual(leafView['color.accent.bg']?.$value);
  });

  it('returns literal for non-aliased tokens', async () => {
    const { parserInput, axes, defaultTuple } = await loadReferenceFixtureParserInput();
    const { graph } = buildTokenGraph(parserInput, axes, defaultTuple);
    const result = resolveAliasAt(graph, 'color.palette.blue.500', defaultTuple);
    expect(result?.aliasOf).toBeUndefined();
    expect(result?.$value).toBeDefined();
  });

  it('preserves aliasOf for aliased tokens at default tuple', async () => {
    const { parserInput, axes, defaultTuple } = await loadReferenceFixtureParserInput();
    const { graph } = buildTokenGraph(parserInput, axes, defaultTuple);
    const result = resolveAliasAt(graph, 'color.accent.bg', defaultTuple);
    expect(result?.aliasOf).toBeDefined();
    expect(typeof result?.aliasOf).toBe('string');
    expect(result?.$value).toBeDefined();
  });

  it('preserves aliasOf for write-introduced aliases', async () => {
    const { parserInput, axes, defaultTuple } = await loadReferenceFixtureParserInput();
    const { graph } = buildTokenGraph(parserInput, axes, defaultTuple);
    const tuple = { ...defaultTuple, mode: 'Dark' };
    const result = resolveAliasAt(graph, 'color.accent.bg', tuple);
    expect(result?.aliasOf).toBeDefined();
  });

  it('preserves $value as the resolved leaf', async () => {
    const { parserInput, axes, defaultTuple } = await loadReferenceFixtureParserInput();
    const { graph } = buildTokenGraph(parserInput, axes, defaultTuple);
    const leafResult = resolveAt(graph, 'color.accent.bg', defaultTuple);
    const aliasResult = resolveAliasAt(graph, 'color.accent.bg', defaultTuple);
    expect(aliasResult?.$value).toEqual(leafResult?.$value);
  });

  it('a literal write over an alias baseline drops the baseline alias metadata', () => {
    const graph = graphWithMetadataBaselines();
    const result = resolveAliasAt(graph, 'color.text', { mode: 'Dark' });
    expect(result?.$value).toBe('#ffffff');
    expect(result?.aliasOf).toBeUndefined();
    expect(result?.aliasChain).toBeUndefined();
  });

  it('a partial-alias write over an alias baseline drops the whole-token alias metadata', () => {
    const graph = graphWithMetadataBaselines();
    const result = resolveAliasAt(graph, 'border.focus', { mode: 'Dark' });
    expect(result?.partialAliasOf).toEqual({ color: 'color.a' });
    expect(result?.aliasOf).toBeUndefined();
    expect(result?.aliasChain).toBeUndefined();
  });

  it('a literal write over a partial-alias baseline drops the baseline partialAliasOf', () => {
    const graph = graphWithMetadataBaselines();
    const result = resolveAliasAt(graph, 'border.input', { mode: 'Dark' });
    expect(result?.$value).toEqual({ color: '#ffffff', width: '1px' });
    expect(result?.partialAliasOf).toBeUndefined();
  });

  it('an alias write over a partial-alias baseline drops the baseline partialAliasOf', () => {
    const graph = graphWithMetadataBaselines();
    const result = resolveAliasAt(graph, 'color.ring', { mode: 'Dark' });
    expect(result?.aliasOf).toBe('border.base');
    expect(result?.partialAliasOf).toBeUndefined();
  });
});
