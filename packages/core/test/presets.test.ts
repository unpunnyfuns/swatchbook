import { describe, expect, it } from 'vitest';
import { validatePresets } from '#/presets.ts';
import type { Axis, Preset } from '#/types.ts';

const axes: Axis[] = [
  {
    name: 'mode',
    contexts: ['Light', 'Dark'],
    default: 'Light',
    source: 'resolver',
  },
  {
    name: 'brand',
    contexts: ['Default', 'Brand A'],
    default: 'Default',
    source: 'resolver',
  },
  {
    name: 'contrast',
    contexts: ['Normal', 'High'],
    default: 'Normal',
    source: 'resolver',
  },
];

describe('validatePresets', () => {
  it('passes a well-formed preset through unchanged', () => {
    const raw: Preset[] = [
      { name: 'Brand A Dark', axes: { mode: 'Dark', brand: 'Brand A' } },
    ];
    const { presets, diagnostics } = validatePresets(raw, axes);
    expect(diagnostics).toEqual([]);
    expect(presets).toEqual(raw);
  });

  it('sanitizes unknown axis keys and emits a warn diagnostic', () => {
    const raw: Preset[] = [
      { name: 'Weird', axes: { mode: 'Dark', nonsense: 'Whatever' } },
    ];
    const { presets, diagnostics } = validatePresets(raw, axes);
    expect(presets).toEqual([{ name: 'Weird', axes: { mode: 'Dark' } }]);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]?.severity).toBe('warn');
    expect(diagnostics[0]?.message).toMatch(/unknown axis "nonsense"/);
    expect(diagnostics[0]?.message).toMatch(/"Weird"/);
  });

  it('sanitizes invalid context values and emits a warn diagnostic', () => {
    const raw: Preset[] = [
      { name: 'Bad Mode', axes: { mode: 'Sepia' } },
    ];
    const { presets, diagnostics } = validatePresets(raw, axes);
    expect(presets).toEqual([{ name: 'Bad Mode', axes: {} }]);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]?.severity).toBe('warn');
    expect(diagnostics[0]?.message).toMatch(/"Sepia"/);
  });

  it('keeps an empty preset after sanitization (resolves to all defaults)', () => {
    const raw: Preset[] = [{ name: 'All Wrong', axes: { nope: 'x' } }];
    const { presets } = validatePresets(raw, axes);
    expect(presets).toEqual([{ name: 'All Wrong', axes: {} }]);
  });

  it('preserves description when present', () => {
    const raw: Preset[] = [
      { name: 'Described', axes: { mode: 'Light' }, description: 'Baseline.' },
    ];
    const { presets } = validatePresets(raw, axes);
    expect(presets[0]?.description).toBe('Baseline.');
  });

  it('returns empty arrays when input is undefined', () => {
    const { presets, diagnostics } = validatePresets(undefined, axes);
    expect(presets).toEqual([]);
    expect(diagnostics).toEqual([]);
  });
});

