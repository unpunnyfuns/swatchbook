/** Max rendered pixel size for a dimension bar/sample before it's capped. */
export const MAX_RENDER_PX = 480;

/**
 * Convert a DTCG dimension `$value` (`{ value, unit }`) to pixels for the
 * purpose of deciding whether to cap the rendered size. `rootFontSizePx`
 * scales `rem` against the rendering context's actual root font-size
 * (default 16 for the no-DOM / SSR path); the bar paints at the same
 * context's `var()`, so passing the measured root keeps the cap decision
 * aligned with what's drawn. Returns `NaN` for anything other than `px` /
 * `rem` — `ex` / `ch` / `%`, and the non-DTCG `em` (the `dimension` type
 * permits only `px | rem`) — which the caller treats as "render at cssVar
 * but don't cap".
 */
export function toPixels(raw: unknown, rootFontSizePx = 16): number {
  if (raw == null || typeof raw !== 'object') return Number.NaN;
  const v = raw as { value?: unknown; unit?: unknown };
  if (typeof v.value !== 'number' || typeof v.unit !== 'string') return Number.NaN;
  switch (v.unit) {
    case 'px':
      return v.value;
    case 'rem':
      return v.value * rootFontSizePx;
    default:
      return Number.NaN;
  }
}
