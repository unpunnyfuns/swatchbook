import type { VirtualTokenListingShape } from '#/contexts.ts';
import { type ColorFormat, formatColor } from '#/format-color.ts';

/**
 * Produce a single-line display string for any DTCG token `$value`.
 *
 * Primary path: plugin-css's `previewValue` from the Token Listing —
 * the CSS string the consumer's production stylesheet would emit for
 * this token. Inspector rendering stays in lockstep with what they
 * ship. The previewValue is run through `cleanFloatNoise` to strip
 * IEEE-754 artefacts (e.g. `55.00000000000001%` → `55%`).
 *
 * Color tokens only take the previewValue when the active toolbar
 * format matches plugin-css's output (hex). Other formats
 * (rgb / hsl / oklch / raw) fall through to local colorjs.io.
 *
 * Fallback path (no listing entry): the local `format*` formatters
 * below produce inspector-friendly compact representations:
 * - `dimension|duration` → `value + unit` (`16px`, `200ms`)
 * - `fontFamily`         → string or array joined with `, `
 * - `cubicBezier`        → `cubic-bezier(a, b, c, d)`
 * - `shadow`             → layers joined with `, `
 * - `border`             → `width style color`
 * - `transition`         → `duration easing [delay]`
 * - `typography`         → `family / size / line-height / weight`
 * - `gradient`           → `stops joined with →`
 *
 * Unknown object shapes fall through to truncated JSON.
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

  // Prefer plugin-css's authoritative `previewValue` whenever it's
  // available. For non-color types it's the CSS string the consumer's
  // production stylesheet would actually emit — keeping inspector
  // rendering in lockstep with what they ship. For color tokens we
  // only take it when the active toolbar format matches plugin-css's
  // output (hex) — other formats (rgb / hsl / oklch / raw) are the
  // user's inspection choice and fall through to local colorjs.io
  // conversion. The local formatters (`formatGradient`,
  // `formatTypography`, etc.) below are only reached when there is no
  // listing entry — e.g. before plugin-token-listing has computed,
  // or when a consumer constructs a project without a listing build.
  //
  // `cleanFloatNoise` strips IEEE-754 representation artefacts that
  // leak through plugin-css's `position * 100` arithmetic for gradient
  // stops (e.g. `55.00000000000001%` for a 0.55 stop). Any decimal
  // with 8+ fractional digits gets rounded to 1/1000 — preserves
  // authored 8ths and gradient/opacity thirds while collapsing the
  // 14th–16th-decimal noise.
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
    case 'transition':
      return formatTransition(value);
    case 'typography':
      return formatTypography(value);
    case 'gradient':
      return formatGradient(value, colorFormat);
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

/**
 * Strip IEEE-754 representation artefacts from inline numbers in a
 * previewValue string. plugin-css's `100 * position` arithmetic for
 * gradient stops emits `55.00000000000001%` for a 0.55 stop (see
 * `@terrazzo/token-tools/css.js:190`). Any decimal with eight or more
 * fractional digits is rounded to 1/1000 — preserves authored 8ths
 * (`0.125`, `0.875`), gradient stops at thirds (`33.333%`, `16.667%`)
 * and opacity at thirds, while collapsing IEEE-754 noise (which lives
 * at the 14th–16th decimal). Defensive layer pending upstream
 * rounding.
 */
function cleanFloatNoise(s: string): string {
  return s.replace(/-?\d+\.\d{8,}/g, (m) => String(Math.round(Number(m) * 1000) / 1000));
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

function formatTransition(v: unknown): string {
  if (!v || typeof v !== 'object') return formatUnknown(v);
  const t = v as Record<string, unknown>;
  const duration = formatDimension(t['duration']);
  const easing = formatPrimitive(t['timingFunction']);
  const delay = formatDimension(t['delay']);
  const parts = [duration, easing];
  // Only emit delay when non-zero. `0ms` / `0s` clutters the one-liner.
  if (!/^0\D/.test(delay) && delay !== '') parts.push(delay);
  return parts.filter((p) => p !== '').join(' ');
}

function formatTypography(v: unknown): string {
  if (!v || typeof v !== 'object') return formatUnknown(v);
  const t = v as Record<string, unknown>;
  const family = formatFontFamily(t['fontFamily']);
  const size = formatDimension(t['fontSize']);
  const lineHeight = formatPrimitive(t['lineHeight']);
  const weight = formatPrimitive(t['fontWeight']);
  return [family, size, lineHeight, weight].filter((p) => p !== '').join(' / ');
}

function formatGradient(v: unknown, colorFormat: ColorFormat): string {
  if (!Array.isArray(v) || v.length === 0) return formatUnknown(v);
  const parts = v.map((stop) => {
    if (!stop || typeof stop !== 'object') return formatUnknown(stop);
    const s = stop as Record<string, unknown>;
    const position =
      typeof s['position'] === 'number' ? `${Math.round(s['position'] * 100)}%` : '?';
    const color = formatColor(s['color'], colorFormat).value;
    return `${color} ${position}`;
  });
  return parts.join(' → ');
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
