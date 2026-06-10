import { COLOR_FORMATS } from '@unpunnyfuns/swatchbook-core/color-formats';
import type { ColorFormat } from '@unpunnyfuns/swatchbook-core/color-formats';
import { formatColor as coreFormatColor } from '@unpunnyfuns/swatchbook-core/format-color';

// Agent-facing color formatting. The rendering kernel lives in core (shared
// with the blocks display surface); this wrapper adds the `format` field
// agents key on, keeps `raw` as the full normalized payload (more useful to
// an agent than the compact display form), and preserves the null-on-invalid
// contract MCP tools rely on.

export type { ColorFormat };

export interface FormatColorResult {
  format: ColorFormat;
  value: string;
  outOfGamut: boolean;
}

// Unique sentinel: core returns this as the value only when it could not
// build a color (unknown space, malformed input), letting us map that back
// to null without re-implementing the validity checks.
const FORMAT_FAILED = '\0swatchbook-format-failed';

export function formatColor(raw: unknown, format: ColorFormat): FormatColorResult | null {
  if (!raw || typeof raw !== 'object') return null;

  if (format === 'raw') {
    return { format, value: JSON.stringify(raw), outOfGamut: false };
  }

  const v = raw as { colorSpace?: unknown; components?: unknown; channels?: unknown };
  const components = v.components ?? v.channels;
  if (!components || typeof v.colorSpace !== 'string') return null;

  const result = coreFormatColor(raw, format, FORMAT_FAILED);
  if (result.value === FORMAT_FAILED) return null;
  return { format, value: result.value, outOfGamut: result.outOfGamut };
}

export const ALL_COLOR_FORMATS: readonly ColorFormat[] = COLOR_FORMATS;

export function formatColorEveryWay(raw: unknown): Partial<Record<ColorFormat, FormatColorResult>> {
  const out: Partial<Record<ColorFormat, FormatColorResult>> = {};
  for (const format of ALL_COLOR_FORMATS) {
    const result = formatColor(raw, format);
    if (result) out[format] = result;
  }
  return out;
}
