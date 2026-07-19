import type { ColorFormat } from '#/format-color.ts';

/**
 * Formats a DTCG dimension-shaped raw value (`number`, pre-formatted
 * string, or `{ value, unit }`) as a CSS length. Shared by the border and
 * shadow presenters, whose `$value` shapes both carry raw dimension fields.
 */
export function formatLength(raw: unknown): string {
  if (typeof raw === 'number') return `${raw}px`;
  if (typeof raw === 'string') return raw;
  if (raw && typeof raw === 'object') {
    const v = raw as { value?: unknown; unit?: unknown };
    if (typeof v.value === 'number' && typeof v.unit === 'string') return `${v.value}${v.unit}`;
  }
  return '0px';
}

/**
 * Maps a display `ColorFormat` to one CSS can actually render as a color
 * value. `raw` renders a JSON debug string (core's `formatColor`), which
 * isn't valid CSS: the border and shadow presenters substitute `hex` for
 * that one format so the swatch still paints; every other format
 * (rgb/hsl/oklch/hex) is already valid CSS.
 */
export function cssColorFormat(format: ColorFormat): Exclude<ColorFormat, 'raw'> {
  return format === 'raw' ? 'hex' : format;
}
