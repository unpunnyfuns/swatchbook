import { formatColor } from '#/format-color.ts';
import type { ColorFormat } from '#/color-formats.ts';
import type { SlimListedToken } from '#/snapshot-for-wire.ts';
import type { BorderValue, DashedStrokeStyleValue, ShadowLayer } from '#/token-value-types.ts';

/**
 * Display a composite sub-field dimension (shadow offset / blur / spread,
 * border width, …) in the preview tables. Renders `—` for a missing
 * sub-field and falls back to JSON for shapes it doesn't recognize.
 *
 * Distinct from `formatTokenValue`'s internal `formatInternalDimension`,
 * which formats a token's top-level value and has no `—` placeholder — these
 * are the per-layer sample formatters shared by `ShadowPreview` + `BorderPreview`.
 */
export function formatDimension(raw: unknown): string {
  if (raw == null) return '—';
  if (typeof raw === 'number') return String(raw);
  if (typeof raw === 'string') return raw;
  if (typeof raw === 'object') {
    const v = raw as { value?: unknown; unit?: unknown };
    if (typeof v.value === 'number' && typeof v.unit === 'string') {
      return `${v.value}${v.unit}`;
    }
  }
  return JSON.stringify(raw);
}

/** Display a composite sub-field color via the active format; `—` when absent. */
export function formatSubColor(raw: unknown, format: ColorFormat): string {
  if (raw == null) return '—';
  return formatColor(raw, format).value;
}

/**
 * Single-line display string for any DTCG token `$value`. Prefers
 * plugin-css's `previewValue` from the Token Listing for non-color tokens
 * (and for color when the toolbar format is hex); other color formats route
 * through local colorjs.io. A raw primitive `$value` is the fallback only
 * when no `previewValue` is present.
 */
export function formatTokenValue(
  value: unknown,
  $type: string | undefined,
  colorFormat: ColorFormat,
  listing?: SlimListedToken,
): string {
  if (value == null) return '';

  const preview = listing?.previewValue;
  if (preview !== undefined) {
    const previewStr = typeof preview === 'string' ? cleanFloatNoise(preview) : String(preview);
    if ($type !== 'color') return previewStr;
    if (colorFormat === 'hex') return previewStr;
  }

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  switch ($type) {
    case 'color':
      return formatColor(value, colorFormat).value;
    case 'dimension':
    case 'duration':
      return formatInternalDimension(value);
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

function formatInternalDimension(v: unknown): string {
  if (typeof v === 'string' || typeof v === 'number') return String(v);
  if (v && typeof v === 'object') {
    const d = v as { value?: unknown; unit?: unknown };
    if (typeof d.value === 'number' && typeof d.unit === 'string') return `${d.value}${d.unit}`;
  }
  return formatUnknown(v);
}

// The leading `\d+` is bounded to 15 digits so a long run of digits with no
// following `.` (adversarial input) can't force catastrophic backtracking;
// no real dimension/number token has a 16+ digit integer part.
function cleanFloatNoise(s: string): string {
  return s.replace(/-?\d{1,15}\.\d{8,}/g, (m) => `${+Number(m).toFixed(3)}`);
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
    const s = v as DashedStrokeStyleValue;
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
    const s = layer as ShadowLayer;
    const pieces = [
      formatInternalDimension(s.offsetX),
      formatInternalDimension(s.offsetY),
      formatInternalDimension(s.blur),
      formatInternalDimension(s.spread),
      formatColor(s.color, colorFormat).value,
    ].filter((p) => p !== '');
    if (s.inset) pieces.push('inset');
    return pieces.join(' ');
  });
  return parts.join(', ');
}

function formatBorder(v: unknown, colorFormat: ColorFormat): string {
  if (!v || typeof v !== 'object') return formatUnknown(v);
  const b = v as BorderValue;
  const width = formatInternalDimension(b.width);
  const style = formatPrimitive(b.style);
  const color = formatColor(b.color, colorFormat).value;
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
