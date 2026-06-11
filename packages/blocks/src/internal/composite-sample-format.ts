import { formatColor } from '#/format-color.ts';
import type { ColorFormat } from '#/format-color.ts';

/**
 * Display a composite sub-field dimension (shadow offset / blur / spread,
 * border width, …) in the preview tables. Renders `—` for a missing
 * sub-field and falls back to JSON for shapes it doesn't recognize.
 *
 * Distinct from `format-token-value`'s internal `formatDimension`, which
 * formats a token's top-level value and has no `—` placeholder — these are
 * the per-layer sample formatters shared by `ShadowPreview` + `BorderPreview`.
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
