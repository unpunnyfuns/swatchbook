import Color from 'colorjs.io';
import type { VirtualToken } from '#/types.ts';

export type SortBy = 'path' | 'value' | 'none';
export type SortDir = 'asc' | 'desc';

export interface SortOptions {
  by?: SortBy;
  dir?: SortDir;
}

type Entry = readonly [string, VirtualToken];

/**
 * Stable sort for a filtered `[path, token][]` list.
 *
 * `sortBy: 'path'` — lexicographic on the dot-path (locale-aware, numeric).
 * `sortBy: 'value'` — per-`$type` ordering:
 *   - `dimension` / `duration` → numeric pixels / ms (via `toMagnitude`).
 *   - `fontWeight` / `opacity` / `number` / `lineHeight` → numeric.
 *   - `color` → perceptual by oklch L → C → H.
 *   - `fontFamily` / `strokeStyle` (string form) → lexicographic.
 *   - Composites (`typography`, `shadow`, `border`, `gradient`, `transition`) →
 *     fall back to path-alpha. No useful single-axis order.
 * `sortBy: 'none'` — preserve input order (still respects `sortDir: 'desc'`
 *   as a reverse).
 */
export function sortTokens(entries: readonly Entry[], options: SortOptions = {}): Entry[] {
  const by = options.by ?? 'path';
  const dir = options.dir ?? 'asc';
  const sign = dir === 'desc' ? -1 : 1;

  if (by === 'none') {
    return dir === 'desc' ? [...entries].toReversed() : [...entries];
  }

  if (by === 'path') {
    return [...entries].toSorted(
      ([a], [b]) => sign * a.localeCompare(b, undefined, { numeric: true }),
    );
  }

  // by === 'value'
  return [...entries].toSorted(([aPath, aTok], [bPath, bTok]) => {
    const cmp = compareValue(aTok, bTok);
    if (cmp !== 0) return sign * cmp;
    // Stable tiebreak on path so the order is deterministic when values equal.
    return sign * aPath.localeCompare(bPath, undefined, { numeric: true });
  });
}

function compareValue(a: VirtualToken, b: VirtualToken): number {
  const type = a.$type;
  // When the two tokens differ in $type, fall back to type-alpha so at
  // least the mixed list clusters by type.
  if (type !== b.$type) return String(type ?? '').localeCompare(String(b.$type ?? ''));
  if (!type) return 0;

  if (
    type === 'dimension' ||
    type === 'duration' ||
    type === 'fontWeight' ||
    type === 'opacity' ||
    type === 'number' ||
    type === 'lineHeight'
  ) {
    const av = toMagnitude(a.$value);
    const bv = toMagnitude(b.$value);
    if (Number.isFinite(av) && Number.isFinite(bv)) return av - bv;
    if (Number.isFinite(av)) return -1;
    if (Number.isFinite(bv)) return 1;
    return 0;
  }

  if (type === 'color') {
    const ak = colorKey(a.$value);
    const bk = colorKey(b.$value);
    if (!ak && !bk) return 0;
    if (!ak) return 1;
    if (!bk) return -1;
    // L → C → H.
    if (ak.l !== bk.l) return ak.l - bk.l;
    if (ak.c !== bk.c) return ak.c - bk.c;
    return ak.h - bk.h;
  }

  if (type === 'fontFamily' || type === 'strokeStyle') {
    const as = toDisplayable(a.$value);
    const bs = toDisplayable(b.$value);
    return as.localeCompare(bs, undefined, { numeric: true });
  }

  // Composite types — no one-dimensional ordering. Callers should have
  // fallen through to 'path' for these; if they didn't, leave untouched.
  return 0;
}

function toMagnitude(v: unknown): number {
  if (typeof v === 'number') return v;
  if (v && typeof v === 'object') {
    const d = v as { value?: unknown; unit?: unknown };
    if (typeof d.value !== 'number') return Number.NaN;
    if (typeof d.unit !== 'string') return d.value;
    switch (d.unit) {
      case 'px':
      case 'ms':
        return d.value;
      case 's':
        return d.value * 1000;
      case 'rem':
      case 'em':
        return d.value * 16;
      default:
        return d.value;
    }
  }
  return Number.NaN;
}

function colorKey(v: unknown): { l: number; c: number; h: number } | null {
  if (!v || typeof v !== 'object') return null;
  try {
    const c = v as {
      colorSpace?: unknown;
      components?: unknown;
      channels?: unknown;
      hex?: unknown;
    };
    let source: unknown;
    if (typeof c.hex === 'string') source = c.hex;
    else if (typeof c.colorSpace === 'string') {
      const channels = Array.isArray(c.components)
        ? c.components
        : Array.isArray(c.channels)
          ? c.channels
          : undefined;
      if (!channels) return null;
      source = { space: c.colorSpace, coords: channels };
    } else return null;
    // Color.js's constructor signature is a string or PlainColorObject —
    // we've already narrowed `source` to one of those shapes above, but
    // the union ends up broader than Color.js's typed surface.
    const color = new Color(source as string);
    const [l, chroma, h] = color.to('oklch').coords;
    // Guard against NaN hue on achromatic colors so the sort stays stable.
    return {
      l: Number.isFinite(l) ? (l as number) : 0,
      c: Number.isFinite(chroma) ? (chroma as number) : 0,
      h: Number.isFinite(h) ? (h as number) : 0,
    };
  } catch {
    return null;
  }
}

function toDisplayable(v: unknown): string {
  if (typeof v === 'string') return v;
  if (Array.isArray(v)) return v.map(String).join(', ');
  if (v && typeof v === 'object') return JSON.stringify(v);
  return String(v ?? '');
}
