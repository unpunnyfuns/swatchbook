import Color from 'colorjs.io';

/**
 * Convert a DTCG color `$value` into the same format menu the
 * addon's toolbar exposes — hex / rgb / hsl / oklch / raw JSON. Mirrors
 * the narrower version in `@unpunnyfuns/swatchbook-blocks/format-color.ts`
 * without pulling blocks (and React) into the MCP server.
 *
 * Out-of-gamut colours still stringify — the caller gets both the
 * rendered string and an `outOfGamut` flag so agents can warn.
 */

export type ColorFormat = 'hex' | 'rgb' | 'hsl' | 'oklch' | 'raw';

export interface FormatColorResult {
  format: ColorFormat;
  value: string;
  outOfGamut: boolean;
}

interface NormalizedColor {
  colorSpace?: string;
  components?: readonly (number | null)[];
  channels?: readonly (number | null)[];
  alpha?: number;
  hex?: string;
}

export function formatColor(raw: unknown, format: ColorFormat): FormatColorResult | null {
  if (!raw || typeof raw !== 'object') return null;
  const normalized = raw as NormalizedColor;

  if (format === 'raw') {
    return { format, value: JSON.stringify(raw), outOfGamut: false };
  }

  const components = normalized.components ?? normalized.channels;
  if (!components || !normalized.colorSpace) return null;

  let color: Color;
  try {
    const coords = components.map((c) => (c == null ? 0 : c));
    const [r = 0, g = 0, b = 0] = coords;
    color = new Color(normalized.colorSpace, [r, g, b], normalized.alpha ?? 1);
  } catch {
    return null;
  }

  if (format === 'hex') {
    try {
      const inSrgb = color.to('srgb');
      const outOfGamut = !inSrgb.inGamut();
      if (outOfGamut) {
        return { format, value: inSrgb.toString({ format: 'rgb' }), outOfGamut: true };
      }
      return { format, value: inSrgb.toString({ format: 'hex' }), outOfGamut: false };
    } catch {
      return null;
    }
  }

  if (format === 'rgb') {
    try {
      const inSrgb = color.to('srgb');
      return {
        format,
        value: inSrgb.toString({ format: 'rgb' }),
        outOfGamut: !inSrgb.inGamut(),
      };
    } catch {
      return null;
    }
  }

  if (format === 'hsl') {
    try {
      const inHsl = color.to('hsl');
      return {
        format,
        value: inHsl.toString(),
        outOfGamut: !color.to('srgb').inGamut(),
      };
    } catch {
      return null;
    }
  }

  if (format === 'oklch') {
    try {
      const inOklch = color.to('oklch');
      return { format, value: inOklch.toString(), outOfGamut: false };
    } catch {
      return null;
    }
  }

  return null;
}

export const ALL_COLOR_FORMATS: readonly ColorFormat[] = ['hex', 'rgb', 'hsl', 'oklch', 'raw'];

export function formatColorEveryWay(raw: unknown): Partial<Record<ColorFormat, FormatColorResult>> {
  const out: Partial<Record<ColorFormat, FormatColorResult>> = {};
  for (const format of ALL_COLOR_FORMATS) {
    const result = formatColor(raw, format);
    if (result) out[format] = result;
  }
  return out;
}
