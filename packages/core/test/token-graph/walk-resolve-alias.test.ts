import { describe, expect, it } from 'vitest';
import { buildTokenGraph } from '#/token-graph/build.ts';
import { resolveAliasAllAt, resolveAliasAt, resolveAllAt, resolveAt } from '#/token-graph/walk.ts';
import { loadReferenceFixtureParserInput } from '../_helpers.ts';

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
});
