import { describe, expect, it } from 'vitest';
import { computeContrast } from '#/contrast.ts';

const black = { colorSpace: 'srgb', components: [0, 0, 0] };
const white = { colorSpace: 'srgb', components: [1, 1, 1] };
const grey = { colorSpace: 'srgb', components: [0.5, 0.5, 0.5] };

describe('computeContrast', () => {
  it('returns null when either color cannot be normalized', () => {
    expect(computeContrast(null, white)).toBeNull();
    expect(computeContrast(white, null)).toBeNull();
    expect(computeContrast({ colorSpace: 'srgb' }, white)).toBeNull();
    expect(computeContrast(white, { components: [1, 0, 0] })).toBeNull();
    expect(computeContrast('not an object', white)).toBeNull();
  });

  it('defaults to WCAG 2.1 and emits the AA/AAA threshold grid for black on white', () => {
    const result = computeContrast(black, white);
    expect(result?.algorithm).toBe('wcag21');
    expect(result?.ratio).toBeGreaterThan(20);
    expect(result?.wcag).toEqual({
      aa: { normal: true, large: true },
      aaa: { normal: true, large: true },
    });
  });

  it('passes WCAG AA large but not AA normal at the 3:1–4.5:1 band', () => {
    // 50% grey on white lands ~3.98:1 — passes large (≥3), fails normal (≥4.5).
    const result = computeContrast(grey, white);
    expect(result?.ratio).toBeGreaterThan(3);
    expect(result?.ratio).toBeLessThan(4.5);
    expect(result?.wcag?.aa).toEqual({ normal: false, large: true });
  });

  it('honors the algorithm flag and returns APCA bronze-tier passes', () => {
    const result = computeContrast(black, white, 'apca');
    expect(result?.algorithm).toBe('apca');
    expect(result?.wcag).toBeUndefined();
    expect(result?.apca?.body).toBe(true);
    expect(result?.apca?.largeText).toBe(true);
    expect(result?.apca?.nonText).toBe(true);
  });

  it('preserves APCA polarity: negative Lc when foreground is darker than background', () => {
    const darkOnLight = computeContrast(black, white, 'apca');
    const lightOnDark = computeContrast(white, black, 'apca');
    expect(darkOnLight?.ratio).toBeLessThan(0);
    expect(lightOnDark?.ratio).toBeGreaterThan(0);
    // Magnitudes match within a small tolerance; the asymmetry is by spec.
    expect(Math.abs(Math.abs(darkOnLight!.ratio) - Math.abs(lightOnDark!.ratio))).toBeLessThan(20);
  });

  it('accepts the `channels` alias for `components`', () => {
    const altBlack = { colorSpace: 'srgb', channels: [0, 0, 0] };
    const altWhite = { colorSpace: 'srgb', channels: [1, 1, 1] };
    const result = computeContrast(altBlack, altWhite);
    expect(result?.ratio).toBeGreaterThan(20);
  });

  it('treats `null` channel values as 0', () => {
    const partialBlack = { colorSpace: 'srgb', components: [0, null, null] };
    const result = computeContrast(partialBlack, white);
    expect(result?.ratio).toBeGreaterThan(15);
  });

  it('returns null when colorjs.io rejects the color space', () => {
    const bogus = { colorSpace: 'not-a-real-space', components: [0, 0, 0] };
    expect(computeContrast(bogus, white)).toBeNull();
  });
});
