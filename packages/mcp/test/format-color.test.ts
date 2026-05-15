import { describe, expect, it } from 'vitest';
import { ALL_COLOR_FORMATS, formatColor, formatColorEveryWay } from '#/format-color.ts';

const red = { colorSpace: 'srgb', components: [1, 0, 0] };
// P3 pure-green sits outside the sRGB gamut — used to exercise the fallback paths.
const greenInP3 = { colorSpace: 'p3', components: [0, 1, 0] };

describe('formatColor', () => {
  it('returns null when the input is not a normalized color object', () => {
    expect(formatColor(null, 'hex')).toBeNull();
    expect(formatColor('not an object', 'hex')).toBeNull();
    expect(formatColor({ components: [1, 0, 0] }, 'hex')).toBeNull();
    expect(formatColor({ colorSpace: 'srgb' }, 'hex')).toBeNull();
  });

  it('"raw" stringifies the input JSON verbatim, regardless of fields', () => {
    const result = formatColor({ colorSpace: 'srgb', components: [1, 0, 0] }, 'raw');
    expect(result).toEqual({
      format: 'raw',
      value: JSON.stringify({ colorSpace: 'srgb', components: [1, 0, 0] }),
      outOfGamut: false,
    });
  });

  it('"hex" emits the canonical hex for in-gamut sRGB colors', () => {
    const result = formatColor(red, 'hex');
    expect(result?.format).toBe('hex');
    expect(result?.value).toBe('#f00');
    expect(result?.outOfGamut).toBe(false);
  });

  it('"hex" falls back to rgb() and flags `outOfGamut` for colors outside sRGB', () => {
    const result = formatColor(greenInP3, 'hex');
    expect(result?.format).toBe('hex');
    expect(result?.value).toMatch(/^rgb\(/);
    expect(result?.outOfGamut).toBe(true);
  });

  it('"rgb" returns a space-separated rgb() string and flags out-of-gamut', () => {
    const inGamut = formatColor(red, 'rgb');
    expect(inGamut?.value).toMatch(/^rgb\(/);
    expect(inGamut?.outOfGamut).toBe(false);

    const outOfGamut = formatColor(greenInP3, 'rgb');
    expect(outOfGamut?.outOfGamut).toBe(true);
  });

  it('"hsl" returns an hsl() string and surfaces the sRGB-gamut check', () => {
    const result = formatColor(red, 'hsl');
    expect(result?.value).toMatch(/^hsl\(/);
    expect(result?.outOfGamut).toBe(false);
  });

  it('"oklch" returns an oklch() string and never reports out-of-gamut (perceptual space covers all visible)', () => {
    const fromSrgb = formatColor(red, 'oklch');
    expect(fromSrgb?.value).toMatch(/^oklch\(/);
    expect(fromSrgb?.outOfGamut).toBe(false);

    const fromP3 = formatColor(greenInP3, 'oklch');
    expect(fromP3?.value).toMatch(/^oklch\(/);
    expect(fromP3?.outOfGamut).toBe(false);
  });

  it('accepts the `channels` alias for `components`', () => {
    const result = formatColor({ colorSpace: 'srgb', channels: [1, 0, 0] }, 'hex');
    expect(result?.value).toBe('#f00');
  });

  it('honors `alpha` when constructing the color', () => {
    const translucent = { colorSpace: 'srgb', components: [1, 0, 0], alpha: 0.5 };
    const result = formatColor(translucent, 'rgb');
    expect(result?.value).toMatch(/\/ 0\.5/);
  });

  it('returns null when colorjs.io rejects the color space', () => {
    const bogus = { colorSpace: 'not-a-real-space', components: [0, 0, 0] };
    expect(formatColor(bogus, 'hex')).toBeNull();
    expect(formatColor(bogus, 'rgb')).toBeNull();
    expect(formatColor(bogus, 'hsl')).toBeNull();
    expect(formatColor(bogus, 'oklch')).toBeNull();
  });
});

describe('formatColorEveryWay', () => {
  it('returns an entry per format the input renders cleanly in', () => {
    const result = formatColorEveryWay(red);
    expect(Object.keys(result).toSorted()).toEqual([...ALL_COLOR_FORMATS].toSorted());
    expect(result.hex?.value).toBe('#f00');
    expect(result.raw?.value).toBe(JSON.stringify(red));
  });

  it('omits formats where conversion failed (e.g. unknown color space)', () => {
    const result = formatColorEveryWay({ colorSpace: 'not-a-real-space', components: [0, 0, 0] });
    // "raw" never reads colorSpace; the converters all fail.
    expect(Object.keys(result)).toEqual(['raw']);
  });

  it('returns an empty object for non-object input', () => {
    expect(formatColorEveryWay(null)).toEqual({});
    expect(formatColorEveryWay('nope')).toEqual({});
  });
});
