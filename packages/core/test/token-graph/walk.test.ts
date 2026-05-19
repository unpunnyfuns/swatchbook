import { describe, expect, it } from 'vitest';
import { buildTokenGraph } from '#/token-graph/build.ts';
import { resolveAliasAllAt, resolveAliasAt, resolveAllAt, resolveAt } from '#/token-graph/walk.ts';
import { valueKey } from '#/value-key.ts';
import { loadReferenceFixtureParserInput } from '../_helpers.ts';

describe('resolveAt walker', () => {
  it('returns baseline value at default tuple', async () => {
    const { parserInput, axes, defaultTuple } = await loadReferenceFixtureParserInput();
    const { graph } = buildTokenGraph(parserInput, axes, defaultTuple);
    const fromGraph = resolveAt(graph, 'color.palette.blue.500', defaultTuple);
    const fromResolver = parserInput.resolver.apply(defaultTuple);
    expect(valueKey(fromGraph)).toBe(valueKey(fromResolver['color.palette.blue.500']));
  });

  it('fast-path: returns baseline for constant tokens at any tuple', async () => {
    const { parserInput, axes, defaultTuple } = await loadReferenceFixtureParserInput();
    const { graph } = buildTokenGraph(parserInput, axes, defaultTuple);
    const constantPath = Object.entries(graph.nodes).find(
      ([, n]) => n.affectedBy.length === 0,
    )?.[0];
    expect(constantPath).toBeDefined();
    const tuple = { ...defaultTuple, mode: 'Dark' };
    const fromGraph = resolveAt(graph, constantPath!, tuple);
    expect(fromGraph).toBe(graph.nodes[constantPath!]?.baselineValue);
  });

  it('follows alias edges at the tuple', async () => {
    const { parserInput, axes, defaultTuple } = await loadReferenceFixtureParserInput();
    const { graph } = buildTokenGraph(parserInput, axes, defaultTuple);
    const tuple = { ...defaultTuple, mode: 'Dark' };
    const fromGraph = resolveAt(graph, 'color.accent.bg', tuple);
    const fromResolver = parserInput.resolver.apply(tuple);
    expect(valueKey(fromGraph)).toBe(valueKey(fromResolver['color.accent.bg']));
  });

  it('last-axis-order wins for multi-axis writes to the same path', async () => {
    const { parserInput, axes, defaultTuple } = await loadReferenceFixtureParserInput();
    const { graph } = buildTokenGraph(parserInput, axes, defaultTuple);
    const tuple = { ...defaultTuple, mode: 'Dark', brand: 'Brand A' };
    const fromGraph = resolveAt(graph, 'color.accent.fg', tuple);
    const fromResolver = parserInput.resolver.apply(tuple);
    expect(valueKey(fromGraph)).toBe(valueKey(fromResolver['color.accent.fg']));
  });

  it('returns undefined for unknown paths', async () => {
    const { parserInput, axes, defaultTuple } = await loadReferenceFixtureParserInput();
    const { graph } = buildTokenGraph(parserInput, axes, defaultTuple);
    expect(resolveAt(graph, 'this.path.does.not.exist', defaultTuple)).toBeUndefined();
  });

  it('memoization: walking the same (path, tuple) twice returns same reference', async () => {
    const { parserInput, axes, defaultTuple } = await loadReferenceFixtureParserInput();
    const { graph } = buildTokenGraph(parserInput, axes, defaultTuple);
    const memo = new Map();
    const tuple = { ...defaultTuple, mode: 'Dark' };
    const a = resolveAt(graph, 'color.accent.bg', tuple, memo);
    const b = resolveAt(graph, 'color.accent.bg', tuple, memo);
    expect(a).toBe(b);
  });
});

describe('resolveAllAt', () => {
  it('resolves every path in the graph', async () => {
    const { parserInput, axes, defaultTuple } = await loadReferenceFixtureParserInput();
    const { graph } = buildTokenGraph(parserInput, axes, defaultTuple);
    const result = resolveAllAt(graph, defaultTuple);
    for (const path of Object.keys(graph.nodes)) {
      expect(result[path], `${path} should be resolved`).toBeDefined();
    }
  });
});

describe('resolveAliasAllAt', () => {
  it('returns alias-preserving tokens for every path in the graph', async () => {
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
});

describe('resolveAliasAt', () => {
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

it('partial-alias composites resolve sub-field aliases at the tuple', async () => {
  const { parserInput, axes, defaultTuple } = await loadReferenceFixtureParserInput();
  const { graph } = buildTokenGraph(parserInput, axes, defaultTuple);
  // border.default is a partial-alias composite in the reference fixture —
  // its $value.color sub-field aliases color.border.default.
  const result = resolveAt(graph, 'border.default', defaultTuple);
  expect(result?.$value).toBeDefined();
  const value = result?.$value as Record<string, unknown>;
  // The color sub-field is the resolved color value, NOT an alias-syntax string
  expect(typeof value['color']).not.toBe('string');
  // Composite color value is an object; confirm it equals the resolved color.border.default
  const expectedColor = resolveAt(graph, 'color.border.default', defaultTuple)?.$value;
  expect(value['color']).toEqual(expectedColor);
});

describe('resolveAt edge cases', () => {
  it('handles empty tuple — returns baseline for every path', async () => {
    const { parserInput, axes, defaultTuple } = await loadReferenceFixtureParserInput();
    const { graph } = buildTokenGraph(parserInput, axes, defaultTuple);
    const result = resolveAt(graph, 'color.palette.blue.500', {});
    // Empty tuple → no axis is non-default → fast-path returns baseline
    expect(result).toEqual(graph.nodes['color.palette.blue.500']?.baselineValue);
  });

  it('handles partial tuple (only some axes specified)', async () => {
    const { parserInput, axes, defaultTuple } = await loadReferenceFixtureParserInput();
    const { graph } = buildTokenGraph(parserInput, axes, defaultTuple);
    const partialTuple = { mode: 'Dark' };
    const result = resolveAt(graph, 'color.accent.bg', partialTuple);
    expect(result).toBeDefined();
    // Should equal what the full tuple at Dark + other defaults produces
    const fullTuple = { ...defaultTuple, mode: 'Dark' };
    const fullResult = resolveAt(graph, 'color.accent.bg', fullTuple);
    expect(result?.$value).toEqual(fullResult?.$value);
  });

  it('handles unknown context for a known axis (falls through to baseline)', async () => {
    const { parserInput, axes, defaultTuple } = await loadReferenceFixtureParserInput();
    const { graph } = buildTokenGraph(parserInput, axes, defaultTuple);
    const result = resolveAt(graph, 'color.accent.bg', { ...defaultTuple, mode: 'Banana' });
    // No writes['mode']['Banana'] → matchedWrite stays undefined → baseline structure resolves
    expect(result).toBeDefined();
    const baseline = resolveAt(graph, 'color.accent.bg', defaultTuple);
    expect(result?.$value).toEqual(baseline?.$value);
  });
});
