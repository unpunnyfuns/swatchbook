import { describe, expect, it } from 'vitest';
import { buildTokenGraph } from '#/token-graph/build.ts';
import { resolveAt } from '#/token-graph/walk.ts';
import type { Axis } from '#/types.ts';
import { valueKey } from '#/value-key.ts';
import { loadReferenceFixtureParserInput } from '../_helpers.ts';

describe('graph walk vs resolver.apply', () => {
  it('matches resolver.apply at every singleton tuple', async () => {
    const { parserInput, axes, defaultTuple } = await loadReferenceFixtureParserInput();
    const { graph } = buildTokenGraph(parserInput, axes, defaultTuple);
    for (const axis of axes) {
      for (const ctx of axis.contexts) {
        const tuple = { ...defaultTuple, [axis.name]: ctx };
        const resolver = parserInput.resolver.apply(tuple);
        for (const path of Object.keys(resolver)) {
          const fromGraph = resolveAt(graph, path, tuple);
          expect(valueKey(fromGraph), `${path} at ${JSON.stringify(tuple)}`).toBe(
            valueKey(resolver[path]),
          );
        }
      }
    }
  });

  it('matches resolver.apply across the full reference fixture cartesian', async () => {
    const { parserInput, axes, defaultTuple } = await loadReferenceFixtureParserInput();
    const { graph } = buildTokenGraph(parserInput, axes, defaultTuple);
    for (const tuple of enumerateCartesian(axes)) {
      const resolver = parserInput.resolver.apply(tuple);
      for (const path of Object.keys(resolver)) {
        const fromGraph = resolveAt(graph, path, tuple);
        expect(valueKey(fromGraph), `${path} at ${JSON.stringify(tuple)}`).toBe(
          valueKey(resolver[path]),
        );
      }
    }
  });
});

function* enumerateCartesian(axes: readonly Axis[]): Generator<Record<string, string>> {
  if (axes.length === 0) {
    yield {};
    return;
  }
  const [first, ...rest] = axes;
  for (const ctx of first!.contexts) {
    for (const subTuple of enumerateCartesian(rest)) {
      yield { ...subTuple, [first!.name]: ctx };
    }
  }
}
