import { describe, expect, it } from 'vitest';
import type { Axis, SwatchbookToken, TokenMap } from '#/types.ts';
import { permutationID } from '#/types.ts';
import { buildTokenGraphFromLayered } from '#/token-graph/build.ts';

describe('buildTokenGraphFromLayered — alias-target switch with coincident resolved values', () => {
  // Regression for issue #992: when an overlay switches color.x from
  // alias(color.a) to alias(color.b) but both color.a and color.b happen to
  // resolve to the same value at that singleton, a value-only diff would skip
  // the write entirely. At a joint tuple where color.a diverges from color.b,
  // the walker would then use the wrong (baseline) alias target.

  it('records alias-target switch even when both targets resolve to the same singleton value', () => {
    const axes: readonly Axis[] = [
      { name: 'mode', contexts: ['Light', 'Dark'], default: 'Light', source: 'layered' },
    ];
    const defaultTuple = { mode: 'Light' };

    const baseline: TokenMap = {
      'color.a': { $type: 'color', $value: '#abc' } as SwatchbookToken,
      'color.b': { $type: 'color', $value: '#abc' } as SwatchbookToken,
      'color.x': { $type: 'color', $value: '#abc', aliasOf: 'color.a' } as SwatchbookToken,
    };

    // Dark singleton: color.x switches its alias target from color.a to
    // color.b. Both still resolve to '#abc' at this singleton, so a
    // value-only equality check would incorrectly skip the write.
    const darkResolved: TokenMap = {
      'color.a': { $type: 'color', $value: '#abc' } as SwatchbookToken,
      'color.b': { $type: 'color', $value: '#abc' } as SwatchbookToken,
      'color.x': { $type: 'color', $value: '#abc', aliasOf: 'color.b' } as SwatchbookToken,
    };

    const darkId = permutationID({ mode: 'Dark' });
    const { graph } = buildTokenGraphFromLayered(
      axes,
      baseline,
      { [darkId]: darkResolved },
      defaultTuple,
    );

    const xWrite = graph.nodes['color.x']?.writes?.['mode']?.['Dark'];
    expect(xWrite).toBeDefined();
    expect(xWrite?.kind).toBe('alias');
    if (xWrite?.kind === 'alias') {
      expect(xWrite.target).toBe('color.b');
    }
  });

  it('does not record a write when the alias target is unchanged even if the resolved value coincides', () => {
    const axes: readonly Axis[] = [
      { name: 'mode', contexts: ['Light', 'Dark'], default: 'Light', source: 'layered' },
    ];
    const defaultTuple = { mode: 'Light' };

    const baseline: TokenMap = {
      'color.a': { $type: 'color', $value: '#abc' } as SwatchbookToken,
      'color.x': { $type: 'color', $value: '#abc', aliasOf: 'color.a' } as SwatchbookToken,
    };

    // Dark singleton: color.x still aliases color.a and resolves to '#abc' —
    // truly a no-op; the write should be omitted.
    const darkResolved: TokenMap = {
      'color.a': { $type: 'color', $value: '#abc' } as SwatchbookToken,
      'color.x': { $type: 'color', $value: '#abc', aliasOf: 'color.a' } as SwatchbookToken,
    };

    const darkId = permutationID({ mode: 'Dark' });
    const { graph } = buildTokenGraphFromLayered(
      axes,
      baseline,
      { [darkId]: darkResolved },
      defaultTuple,
    );

    const xWrite = graph.nodes['color.x']?.writes?.['mode']?.['Dark'];
    expect(xWrite).toBeUndefined();
  });
});
