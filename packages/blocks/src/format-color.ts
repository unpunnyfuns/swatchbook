import Color from 'colorjs.io';
import type { ColorValue } from '#/internal/composite-types.ts';

/**
 * Color display formats understood by {@link formatColor}.
 *
 * - `hex` — sRGB hex (`#rrggbb` or `#rrggbbaa`). Out-of-gamut or wide-gamut
 *   colors fall back to `rgb()` and surface `outOfGamut: true` so callers
 *   can render a ⚠ glyph.
 * - `rgb` / `hsl` — modern CSS Color 4 space-separated syntax, converted
 *   from the source colorspace. Out-of-gamut values are still stringified
 *   (the browser will clip when actually rendering) and flagged.
 * - `oklch` — perceptual wide-gamut form. Never marks out-of-gamut because
 *   every color expressible in sRGB/P3 fits in oklch.
 * - `raw` — compact JSON of the normalized Terrazzo shape. For DTCG
 *   authors who want to see what the parser actually stored.
 */
export type ColorFormat = 'hex' | 'rgb' | 'hsl' | 'oklch' | 'raw';

export const COLOR_FORMATS: readonly ColorFormat[] = ['hex', 'rgb', 'hsl', 'oklch', 'raw'];

/**
 * Terrazzo's `ColorValueNormalized`, copied inline to avoid a hard dep on
 * `@terrazzo/token-tools` from blocks. Matches the shape documented at
 * https://terrazzo.app/docs/cli/reference/token-tools/ColorValueNormalized.
 *
 * Some token payloads we see in the wild use the legacy DTCG-ish `channels`
 * field in place of `components`; we accept either.
 */
export interface NormalizedColor {
  colorSpace: string;
  components?: readonly (number | null)[];
  channels?: readonly (number | null)[];
  alpha?: number;
  hex?: string;
}

export interface FormatColorResult {
  /** Display string — e.g. `rgb(59 132 246)`, `#3b82f6`. */
  value: string;
  /** True when the requested format can't losslessly represent the color. */
  outOfGamut: boolean;
}

const DEFAULT_FALLBACK = '—';

/**
 * Convert Terrazzo's normalized color payload into a display string in the
 * requested format. Pure function — never throws; returns `{ value: '—' }`
 * for unrecognized input so calling blocks don't need try/catch.
 */
export function formatColor(
  value: unknown,
  format: ColorFormat,
  fallback: string = DEFAULT_FALLBACK,
): FormatColorResult {
  const normalized = coerce(value);
  if (!normalized) return { value: stringifyFallback(value, fallback), outOfGamut: false };

  if (format === 'raw') {
    return { value: compactJson(normalized), outOfGamut: false };
  }

  const color = toColor(normalized);
  if (!color) return { value: stringifyFallback(value, fallback), outOfGamut: false };

  const alpha = typeof normalized.alpha === 'number' ? normalized.alpha : 1;

  if (format === 'hex') return formatHex(color, alpha);
  if (format === 'rgb') return formatRgb(color, alpha);
  if (format === 'hsl') return formatHsl(color, alpha);
  return formatOklch(color, alpha);
}

function coerce(value: unknown): NormalizedColor | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as ColorValue;
  const colorSpace = typeof v.colorSpace === 'string' ? v.colorSpace : undefined;
  const components = Array.isArray(v.components)
    ? (v.components as (number | null)[])
    : Array.isArray(v.channels)
      ? (v.channels as (number | null)[])
      : undefined;
  if (!colorSpace || !components) {
    if (typeof v.hex === 'string') {
      return { colorSpace: 'srgb', components: hexToComponents(v.hex) };
    }
    return null;
  }
  const alpha = typeof v.alpha === 'number' ? v.alpha : undefined;
  const hexVal = v['hex'];
  const hex = typeof hexVal === 'string' ? hexVal : undefined;
  return {
    colorSpace,
    components,
    ...(alpha !== undefined && { alpha }),
    ...(hex !== undefined && { hex }),
  };
}

function hexToComponents(hex: string): number[] {
  const h = hex.replace('#', '');
  const expanded =
    h.length === 3 || h.length === 4
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h;
  const r = parseInt(expanded.slice(0, 2), 16) / 255;
  const g = parseInt(expanded.slice(2, 4), 16) / 255;
  const b = parseInt(expanded.slice(4, 6), 16) / 255;
  return [r, g, b];
}

/**
 * Map Terrazzo's canonical CSS Color 4 space identifiers to the shorter
 * identifiers colorjs.io registers. Only the ones that differ need an entry.
 */
const COLORJS_SPACE_ALIASES: Record<string, string> = {
  'display-p3': 'p3',
  'a98-rgb': 'a98rgb',
  'prophoto-rgb': 'prophoto',
};

function toColor(normalized: NormalizedColor): Color | null {
  const source = normalized.components ?? normalized.channels ?? [];
  const coords: [number, number, number] = [
    numberOrZero(source[0]),
    numberOrZero(source[1]),
    numberOrZero(source[2]),
  ];
  const space = COLORJS_SPACE_ALIASES[normalized.colorSpace] ?? normalized.colorSpace;
  try {
    return new Color(space, coords, normalized.alpha ?? 1);
  } catch {
    return null;
  }
}

function numberOrZero(n: number | null | undefined): number {
  return typeof n === 'number' && !Number.isNaN(n) ? n : 0;
}

function coord(color: Color, i: number): number {
  const c = color.coords[i];
  return typeof c === 'number' && !Number.isNaN(c) ? c : 0;
}

function formatHex(color: Color, alpha: number): FormatColorResult {
  const srgb = color.to('srgb');
  const inGamut = srgb.inGamut('srgb');
  if (!inGamut) {
    const rgb = formatRgb(color, alpha);
    return { value: rgb.value, outOfGamut: true };
  }
  const r = clamp255(coord(srgb, 0));
  const g = clamp255(coord(srgb, 1));
  const b = clamp255(coord(srgb, 2));
  const base = `#${toHexByte(r)}${toHexByte(g)}${toHexByte(b)}`;
  if (alpha >= 1) return { value: base, outOfGamut: false };
  const a = clamp255(alpha);
  return { value: `${base}${toHexByte(a)}`, outOfGamut: false };
}

function formatRgb(color: Color, alpha: number): FormatColorResult {
  const srgb = color.to('srgb');
  const inGamut = srgb.inGamut('srgb');
  const r = Math.round(clampUnit(coord(srgb, 0)) * 255);
  const g = Math.round(clampUnit(coord(srgb, 1)) * 255);
  const b = Math.round(clampUnit(coord(srgb, 2)) * 255);
  const body = `${r} ${g} ${b}`;
  const value = alpha >= 1 ? `rgb(${body})` : `rgb(${body} / ${roundAlpha(alpha)})`;
  return { value, outOfGamut: !inGamut };
}

function formatHsl(color: Color, alpha: number): FormatColorResult {
  const hsl = color.to('hsl');
  const srgb = color.to('srgb');
  const inGamut = srgb.inGamut('srgb');
  const hue = roundHue(coord(hsl, 0));
  const sat = roundPercent(coord(hsl, 1));
  const light = roundPercent(coord(hsl, 2));
  const body = `${hue} ${sat}% ${light}%`;
  const value = alpha >= 1 ? `hsl(${body})` : `hsl(${body} / ${roundAlpha(alpha)})`;
  return { value, outOfGamut: !inGamut };
}

function formatOklch(color: Color, alpha: number): FormatColorResult {
  const oklch = color.to('oklch');
  const L = roundTo(coord(oklch, 0), 3);
  const C = roundTo(coord(oklch, 1), 3);
  const H = roundTo(coord(oklch, 2), 2);
  const body = `${L} ${C} ${H}`;
  const value = alpha >= 1 ? `oklch(${body})` : `oklch(${body} / ${roundAlpha(alpha)})`;
  return { value, outOfGamut: false };
}

function clamp255(n: number): number {
  return Math.max(0, Math.min(255, Math.round(n * 255)));
}

function clampUnit(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function toHexByte(n: number): string {
  return n.toString(16).padStart(2, '0');
}

function roundTo(n: number, digits: number): number {
  const f = 10 ** digits;
  return Math.round(n * f) / f;
}

function roundHue(h: number): number {
  return roundTo(((h % 360) + 360) % 360, 1);
}

function roundPercent(n: number): number {
  return Math.round(n * 10) / 10;
}

function roundAlpha(a: number): number {
  return roundTo(a, 3);
}

function compactJson(value: NormalizedColor): string {
  const parts: string[] = [`"colorSpace":${JSON.stringify(value.colorSpace)}`];
  const components = value.components ?? value.channels;
  if (components) {
    parts.push(`"components":[${components.map((c) => (c === null ? 'null' : c)).join(', ')}]`);
  }
  if (typeof value.alpha === 'number' && value.alpha !== 1) {
    parts.push(`"alpha":${value.alpha}`);
  }
  return `{ ${parts.join(', ')} }`;
}

function stringifyFallback(value: unknown, fallback: string): string {
  if (value == null) return fallback;
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  return fallback;
}
