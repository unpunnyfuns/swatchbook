import Color from 'colorjs.io';

/**
 * Pair-wise contrast between two DTCG color `$value`s. Wraps
 * `colorjs.io`'s contrast primitives with pass/fail grids for the
 * thresholds agents typically reason against (WCAG 2.1 AA/AAA
 * normal/large; APCA body / large text / non-text).
 *
 * Kept separate from `format-color.ts` even though both build
 * `Color` instances from the same DTCG shape — the color-format
 * formatter stringifies, this one does arithmetic, and they're
 * called from different tool paths.
 */

interface ColorInput {
  colorSpace?: string;
  components?: readonly (number | null)[];
  channels?: readonly (number | null)[];
  alpha?: number;
}

function toColor(raw: unknown): Color | null {
  if (!raw || typeof raw !== 'object') return null;
  const n = raw as ColorInput;
  const components = n.components ?? n.channels;
  if (!components || !n.colorSpace) return null;
  const coords = components.map((c) => (c == null ? 0 : c));
  const [r = 0, g = 0, b = 0] = coords;
  try {
    return new Color(n.colorSpace, [r, g, b], n.alpha ?? 1);
  } catch {
    return null;
  }
}

export type ContrastAlgorithm = 'wcag21' | 'apca';

export interface WcagPasses {
  aa: { normal: boolean; large: boolean };
  aaa: { normal: boolean; large: boolean };
}

export interface ApcaPasses {
  lc: number;
  body: boolean;
  largeText: boolean;
  nonText: boolean;
}

export interface ContrastResult {
  algorithm: ContrastAlgorithm;
  /**
   * WCAG 2.1 returns the contrast ratio (1–21). APCA returns a signed
   * Lc value (-108..+106); the sign marks polarity (negative = dark
   * text on light background; positive = light on dark). Consumers
   * usually care about `Math.abs(ratio)` for threshold checks.
   */
  ratio: number;
  wcag?: WcagPasses;
  apca?: ApcaPasses;
}

export function computeContrast(
  foreground: unknown,
  background: unknown,
  algorithm: ContrastAlgorithm = 'wcag21',
): ContrastResult | null {
  const fg = toColor(foreground);
  const bg = toColor(background);
  if (!fg || !bg) return null;

  if (algorithm === 'wcag21') {
    const ratio = fg.contrast(bg, 'WCAG21');
    return {
      algorithm: 'wcag21',
      ratio,
      wcag: {
        aa: { normal: ratio >= 4.5, large: ratio >= 3 },
        aaa: { normal: ratio >= 7, large: ratio >= 4.5 },
      },
    };
  }

  /**
   * APCA thresholds from the Silver draft guidance. These are the
   * "body text / large text / non-text" bronze tier thresholds most
   * tooling settles on; the full table has more gradations but
   * agents rarely need them. Non-text = icons, focus rings, UI
   * borders.
   */
  const lc = fg.contrast(bg, 'APCA');
  const absLc = Math.abs(lc);
  return {
    algorithm: 'apca',
    ratio: lc,
    apca: {
      lc,
      body: absLc >= 75,
      largeText: absLc >= 60,
      nonText: absLc >= 45,
    },
  };
}
