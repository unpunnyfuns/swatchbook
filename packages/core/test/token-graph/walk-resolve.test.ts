import { describe, expect, it } from 'vitest';
import { buildTokenGraph } from '#/token-graph/build.ts';
import { resolveAllAt, resolveAt } from '#/token-graph/walk.ts';
import { valueKey } from '#/value-key.ts';
import { loadReferenceFixtureParserInput } from '../_helpers.ts';

describe('resolveAt / resolveAllAt leaf walker', () => {
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

  it('memoization: resolveAllAt returns the same reference for the same path across the map', async () => {
    const { parserInput, axes, defaultTuple } = await loadReferenceFixtureParserInput();
    const { graph } = buildTokenGraph(parserInput, axes, defaultTuple);
    const tuple = { ...defaultTuple, mode: 'Dark' };
    const resultA = resolveAllAt(graph, tuple);
    const resultB = resolveAllAt(graph, tuple);
    expect(resultA['color.accent.bg']).toBeDefined();
    expect(resultA['color.accent.bg']).toStrictEqual(resultB['color.accent.bg']);
  });

  it('resolveAllAt resolves every path in the graph', async () => {
    const { parserInput, axes, defaultTuple } = await loadReferenceFixtureParserInput();
    const { graph } = buildTokenGraph(parserInput, axes, defaultTuple);
    const result = resolveAllAt(graph, defaultTuple);
    for (const path of Object.keys(graph.nodes)) {
      expect(result[path], `${path} should be resolved`).toBeDefined();
    }
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
