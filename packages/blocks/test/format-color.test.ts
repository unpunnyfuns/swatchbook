import { describe, expect, it } from 'vitest';
import { formatColor } from '#/format-color.ts';

describe('formatColor', () => {
  it('renders sRGB hex by default for in-gamut colors', () => {
    const out = formatColor({ colorSpace: 'srgb', components: [0.231, 0.51, 0.965] }, 'hex');
    expect(out).toEqual({ value: '#3b82f6', outOfGamut: false });
  });

  it('renders pure black as #000000', () => {
    const out = formatColor({ colorSpace: 'srgb', components: [0, 0, 0] }, 'hex');
    expect(out.value).toBe('#000000');
    expect(out.outOfGamut).toBe(false);
  });

  it('renders pure white as #ffffff', () => {
    const out = formatColor({ colorSpace: 'srgb', components: [1, 1, 1] }, 'hex');
    expect(out.value).toBe('#ffffff');
  });

  it('appends alpha byte to hex when alpha < 1', () => {
    const out = formatColor({ colorSpace: 'srgb', components: [0, 0, 0], alpha: 0.5 }, 'hex');
    expect(out.value).toBe('#00000080');
  });

  it('renders rgb() in modern space-separated syntax', () => {
    const out = formatColor({ colorSpace: 'srgb', components: [0.231, 0.51, 0.965] }, 'rgb');
    expect(out.value).toBe('rgb(59 130 246)');
    expect(out.outOfGamut).toBe(false);
  });

  it('renders rgb() with slash alpha when alpha < 1', () => {
    const out = formatColor({ colorSpace: 'srgb', components: [1, 0, 0], alpha: 0.25 }, 'rgb');
    expect(out.value).toBe('rgb(255 0 0 / 0.25)');
  });

  it('renders hsl() in modern syntax with percent saturation/lightness', () => {
    const out = formatColor({ colorSpace: 'srgb', components: [0.231, 0.51, 0.965] }, 'hsl');
    expect(out.value).toMatch(/^hsl\(\d+(?:\.\d+)? \d+(?:\.\d+)?% \d+(?:\.\d+)?%\)$/);
  });

  it('renders oklch() with three numeric coordinates', () => {
    const out = formatColor({ colorSpace: 'srgb', components: [0.231, 0.51, 0.965] }, 'oklch');
    expect(out.value).toMatch(/^oklch\(\d+(?:\.\d+)? \d+(?:\.\d+)? \d+(?:\.\d+)?\)$/);
    expect(out.outOfGamut).toBe(false);
  });

  it('falls back to rgb() and flags outOfGamut when a wide-gamut color is rendered as hex', () => {
    const p3Red = { colorSpace: 'display-p3', components: [1, 0, 0] };
    const out = formatColor(p3Red, 'hex');
    expect(out.value.startsWith('rgb(')).toBe(true);
    expect(out.outOfGamut).toBe(true);
  });

  it('does not mark sRGB in-gamut colors as outOfGamut for hex', () => {
    const out = formatColor({ colorSpace: 'srgb', components: [0.5, 0.5, 0.5] }, 'hex');
    expect(out.outOfGamut).toBe(false);
  });

  it('never marks oklch as out of gamut (oklch superset of sRGB/P3)', () => {
    const p3Red = { colorSpace: 'display-p3', components: [1, 0, 0] };
    const out = formatColor(p3Red, 'oklch');
    expect(out.outOfGamut).toBe(false);
  });

  it('raw format returns compact JSON of the normalized Terrazzo shape', () => {
    const out = formatColor({ colorSpace: 'srgb', components: [0.231, 0.51, 0.965] }, 'raw');
    expect(out.value).toBe('{ "colorSpace":"srgb", "components":[0.231, 0.51, 0.965] }');
    expect(out.outOfGamut).toBe(false);
  });

  it('raw format includes alpha only when not 1', () => {
    const a1 = formatColor({ colorSpace: 'srgb', components: [0, 0, 0], alpha: 1 }, 'raw');
    expect(a1.value).toBe('{ "colorSpace":"srgb", "components":[0, 0, 0] }');
    const a05 = formatColor({ colorSpace: 'srgb', components: [0, 0, 0], alpha: 0.5 }, 'raw');
    expect(a05.value).toBe('{ "colorSpace":"srgb", "components":[0, 0, 0], "alpha":0.5 }');
  });

  it('accepts legacy { hex } payloads', () => {
    const out = formatColor({ hex: '#3b82f6' }, 'rgb');
    expect(out.value).toBe('rgb(59 130 246)');
  });

  it('returns the fallback "—" for non-color input', () => {
    expect(formatColor(null, 'hex').value).toBe('—');
    expect(formatColor(undefined, 'hex').value).toBe('—');
    expect(formatColor({}, 'hex').value).toBe('—');
  });

  it('passes numeric/string values through as their own string for non-color input', () => {
    expect(formatColor(42, 'hex').value).toBe('42');
    expect(formatColor('#fff', 'hex').value).toBe('#fff');
  });

  it('respects a custom fallback', () => {
    expect(formatColor(null, 'hex', 'N/A').value).toBe('N/A');
  });
});
