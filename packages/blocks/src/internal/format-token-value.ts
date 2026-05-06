import type { VirtualTokenListingShape } from '#/contexts.ts';
import { type ColorFormat, formatColor } from '#/format-color.ts';

/**
 * Single-line display string for any DTCG token `$value`. Prefers
 * plugin-css's `previewValue` from the Token Listing; for color
 * tokens only when the toolbar format is hex (other formats route
 * through local colorjs.io).
 */
export function formatTokenValue(
  value: unknown,
  $type: string | undefined,
  colorFormat: ColorFormat,
  listingEntry?: VirtualTokenListingShape,
): string {
  if (value == null) return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  const preview = listingEntry?.previewValue;
  if (preview !== undefined) {
    const previewStr = typeof preview === 'string' ? cleanFloatNoise(preview) : String(preview);
    if ($type !== 'color') return previewStr;
    if (colorFormat === 'hex') return previewStr;
  }

  switch ($type) {
    case 'color':
      return formatColor(value, colorFormat).value;
    case 'dimension':
    case 'duration':
      return formatDimension(value);
    case 'fontFamily':
      return formatFontFamily(value);
    case 'fontWeight':
    case 'lineHeight':
    case 'letterSpacing':
    case 'opacity':
    case 'number':
      return formatPrimitive(value);
    case 'cubicBezier':
      return formatCubicBezier(value);
    case 'strokeStyle':
      return formatStrokeStyle(value);
    case 'shadow':
      return formatShadow(value, colorFormat);
    case 'border':
      return formatBorder(value, colorFormat);
    default:
      return formatUnknown(value);
  }
}

function formatDimension(v: unknown): string {
  if (typeof v === 'string' || typeof v === 'number') return String(v);
  if (v && typeof v === 'object') {
    const d = v as { value?: unknown; unit?: unknown };
    if (typeof d.value === 'number' && typeof d.unit === 'string') return `${d.value}${d.unit}`;
  }
  return formatUnknown(v);
}

function cleanFloatNoise(s: string): string {
  return s.replace(/-?\d+\.\d{8,}/g, (m) => `${+Number(m).toFixed(3)}`);
}

function formatFontFamily(v: unknown): string {
  if (typeof v === 'string') return v;
  if (Array.isArray(v)) return v.map(String).join(', ');
  return formatUnknown(v);
}

function formatPrimitive(v: unknown): string {
  if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') return String(v);
  return formatUnknown(v);
}

function formatCubicBezier(v: unknown): string {
  if (Array.isArray(v) && v.length === 4) {
    return `cubic-bezier(${v.map((n) => (typeof n === 'number' ? n : 0)).join(', ')})`;
  }
  return formatUnknown(v);
}

function formatStrokeStyle(v: unknown): string {
  if (typeof v === 'string') return v;
  if (v && typeof v === 'object') {
    const s = v as { dashArray?: unknown; lineCap?: unknown };
    const parts: string[] = ['dashed'];
    if (Array.isArray(s.dashArray)) {
      parts.push(s.dashArray.map((n) => formatDimension(n)).join(' '));
    }
    if (typeof s.lineCap === 'string') parts.push(s.lineCap);
    return parts.join(' · ');
  }
  return formatUnknown(v);
}

function formatShadow(v: unknown, colorFormat: ColorFormat): string {
  const layers = Array.isArray(v) ? v : [v];
  const parts = layers.map((layer) => {
    if (!layer || typeof layer !== 'object') return formatUnknown(layer);
    const s = layer as Record<string, unknown>;
    const pieces = [
      formatDimension(s['offsetX']),
      formatDimension(s['offsetY']),
      formatDimension(s['blur']),
      formatDimension(s['spread']),
      formatColor(s['color'], colorFormat).value,
    ].filter((p) => p !== '');
    if (s['inset']) pieces.push('inset');
    return pieces.join(' ');
  });
  return parts.join(', ');
}

function formatBorder(v: unknown, colorFormat: ColorFormat): string {
  if (!v || typeof v !== 'object') return formatUnknown(v);
  const b = v as Record<string, unknown>;
  const width = formatDimension(b['width']);
  const style = formatPrimitive(b['style']);
  const color = formatColor(b['color'], colorFormat).value;
  return [width, style, color].filter((p) => p !== '').join(' ');
}

function formatUnknown(v: unknown): string {
  if (v == null) return '';
  if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') return String(v);
  try {
    return JSON.stringify(v).slice(0, 120);
  } catch {
    return String(v);
  }
}
