import { describe, expect, it } from 'vitest';
import { buildTokenGraph } from '#/token-graph/build.ts';
import { resolveAliasAt, resolveAllAt, resolveAt } from '#/token-graph/walk.ts';
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
