/**
 * Numeric duration (ms) the motion preview should animate over for a given
 * token type, read from its resolved `$value`. Lets the sample's toggle loop
 * match the token's real duration instead of a fixed cadence — a long token
 * (say 2s) otherwise reverses mid-move under the old hardcoded interval.
 * Returns `undefined` for types that carry no duration, so the caller can
 * fall back to its default.
 */
export function transitionDurationMs(
  type: string | undefined,
  rawValue: unknown,
): number | undefined {
  // The cubicBezier sample animates `left 800ms <bezier>`, so its loop is fixed.
  if (type === 'cubicBezier') return 800;
  if (type === 'duration') return parseDurationMs(rawValue);
  if (type === 'transition' && rawValue !== null && typeof rawValue === 'object') {
    return parseDurationMs((rawValue as { duration?: unknown }).duration);
  }
  return undefined;
}

// Parse a DTCG duration (`{ value, unit }`), a CSS string (`300ms` / `1.5s`),
// or a bare number (treated as ms) into milliseconds.
function parseDurationMs(v: unknown): number | undefined {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const m = /^([\d.]+)(ms|s)?$/.exec(v.trim());
    if (!m?.[1]) return undefined;
    const n = Number(m[1]);
    if (Number.isNaN(n)) return undefined;
    return m[2] === 's' ? n * 1000 : n;
  }
  if (v !== null && typeof v === 'object') {
    const d = v as { value?: unknown; unit?: unknown };
    if (typeof d.value === 'number') return d.unit === 's' ? d.value * 1000 : d.value;
  }
  return undefined;
}
