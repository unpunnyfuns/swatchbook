/** Max rendered pixel size for a dimension bar/sample before it's capped. */
export const MAX_RENDER_PX = 480;

/**
 * Convert a DTCG dimension `$value` (`{ value, unit }`) to pixels for the
 * purpose of deciding whether to cap the rendered size. Returns `NaN` for
 * units we can't reasonably approximate (ex / ch / %), which the caller
 * treats as "render at cssVar but don't cap".
 */
export function toPixels(raw: unknown): number {
  if (raw == null || typeof raw !== 'object') return Number.NaN;
  const v = raw as { value?: unknown; unit?: unknown };
  if (typeof v.value !== 'number' || typeof v.unit !== 'string') return Number.NaN;
  switch (v.unit) {
    case 'px':
      return v.value;
    case 'rem':
    case 'em':
      return v.value * 16;
    default:
      return Number.NaN;
  }
}
