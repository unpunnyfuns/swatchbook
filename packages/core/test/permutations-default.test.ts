/**
 * Direct unit coverage of `resolveDefaultTuple` from
 * `src/permutations/default.ts`. The function merges the
 * author-supplied `config.default` onto the axis-default baseline and
 * surfaces `swatchbook/default` warnings for unknown axes / invalid
 * contexts.
 */
import { describe, expect, it } from 'vitest';
import type { Axis } from '#/types.ts';
import { resolveDefaultTuple } from '#/permutations/default.ts';

function axis(name: string, contexts: string[], dflt: string): Axis {
  return { name, contexts, default: dflt, source: 'resolver' };
}

const AXES: Axis[] = [
  axis('mode', ['Light', 'Dark'], 'Light'),
  axis('brand', ['Default', 'Brand A'], 'Default'),
  axis('contrast', ['Normal', 'High'], 'Normal'),
];

describe('resolveDefaultTuple', () => {
  it('returns the axis-default baseline when `explicit` is undefined', () => {
    const { tuple, diagnostics } = resolveDefaultTuple(undefined, AXES);
    expect(tuple).toEqual({ mode: 'Light', brand: 'Default', contrast: 'Normal' });
    expect(diagnostics).toEqual([]);
  });

  it('returns the axis-default baseline when `explicit` is an empty object', () => {
    const { tuple, diagnostics } = resolveDefaultTuple({}, AXES);
    expect(tuple).toEqual({ mode: 'Light', brand: 'Default', contrast: 'Normal' });
    expect(diagnostics).toEqual([]);
  });

  it('applies author overrides for known axes + valid contexts', () => {
    const { tuple, diagnostics } = resolveDefaultTuple({ mode: 'Dark', brand: 'Brand A' }, AXES);
    expect(tuple).toEqual({ mode: 'Dark', brand: 'Brand A', contrast: 'Normal' });
    expect(diagnostics).toEqual([]);
  });

  it('skips entries whose value is `undefined`', () => {
    // Author may pass `{ mode: undefined }` from a partial spread; treat
    // as "not specified" rather than an error.
    const { tuple, diagnostics } = resolveDefaultTuple({ mode: undefined, brand: 'Brand A' }, AXES);
    expect(tuple).toEqual({ mode: 'Light', brand: 'Brand A', contrast: 'Normal' });
    expect(diagnostics).toEqual([]);
  });

  it('emits a warn diagnostic for unknown axis names and drops the entry', () => {
    const { tuple, diagnostics } = resolveDefaultTuple({ density: 'Compact' }, AXES);
    expect(tuple).toEqual({ mode: 'Light', brand: 'Default', contrast: 'Normal' });
    expect(diagnostics).toHaveLength(1);
    const diag = diagnostics[0];
    expect(diag?.severity).toBe('warn');
    expect(diag?.group).toBe('swatchbook/default');
    expect(diag?.message).toContain('density');
  });

  it('emits a warn diagnostic for valid axis + invalid context, falls back to axis default', () => {
    const { tuple, diagnostics } = resolveDefaultTuple({ mode: 'Twilight' }, AXES);
    expect(tuple['mode']).toBe('Light');
    expect(diagnostics).toHaveLength(1);
    const diag = diagnostics[0];
    expect(diag?.severity).toBe('warn');
    expect(diag?.group).toBe('swatchbook/default');
    expect(diag?.message).toContain('mode');
    expect(diag?.message).toContain('Twilight');
    // Message lists the valid contexts so the user knows how to fix it.
    expect(diag?.message).toContain('Light');
    expect(diag?.message).toContain('Dark');
  });

  it('keeps reporting per-axis diagnostics for a mix of valid + invalid + unknown', () => {
    const { tuple, diagnostics } = resolveDefaultTuple(
      { mode: 'Dark', brand: 'NopeBrand', density: 'Compact' },
      AXES,
    );
    expect(tuple).toEqual({ mode: 'Dark', brand: 'Default', contrast: 'Normal' });
    expect(diagnostics).toHaveLength(2);
    expect(diagnostics.map((d) => d.message)).toEqual(
      expect.arrayContaining([expect.stringContaining('brand'), expect.stringContaining('density')]),
    );
  });

  it('returns no diagnostics when every axis override is valid', () => {
    const { diagnostics } = resolveDefaultTuple(
      { mode: 'Dark', brand: 'Brand A', contrast: 'High' },
      AXES,
    );
    expect(diagnostics).toEqual([]);
  });
});
