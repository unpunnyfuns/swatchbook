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
/**
 * Pre-computed per-token sort key — one of three shapes depending on
 * `$type`. The comparator looks the key up by token-reference once
 * per pair instead of recomputing on every comparison (Schwartzian
 * transform).
 *
 * For N tokens, sort does O(N log N) comparisons; per-call cost for
 * colors was an Oklch conversion (a `new Color()` + `to('oklch')`)
 * which dominates wall time on real fixtures. Pre-computing brings
 * that down to O(N) keys + O(N log N) cheap lookups.
 */
type SortKey =
  | { kind: 'numeric'; value: number; valid: boolean }
  | { kind: 'color'; key: { l: number; c: number; h: number } | null }
  | { kind: 'string'; value: string }
  | { kind: 'none' };

const NUMERIC_TYPES = new Set([
  'dimension',
  'duration',
  'fontWeight',
  'opacity',
  'number',
  'lineHeight',
]);

const STRING_TYPES = new Set(['fontFamily', 'strokeStyle']);

function computeSortKey(token: VirtualToken): SortKey {
  const type = token.$type;
  if (!type) return { kind: 'none' };
  if (NUMERIC_TYPES.has(type)) {
    const value = toMagnitude(token.$value);
    return { kind: 'numeric', value, valid: Number.isFinite(value) };
  }
  if (type === 'color') {
    return { kind: 'color', key: colorKey(token.$value) };
  }
  if (STRING_TYPES.has(type)) {
    return { kind: 'string', value: toDisplayable(token.$value) };
  }
  // Composite types ($type: 'typography', 'shadow', 'border', …) have
  // no useful one-dimensional ordering — fall back to no-op.
  return { kind: 'none' };
}

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

  // by === 'value' — pre-compute per-token sort keys once.
  const keys = new Map<VirtualToken, SortKey>();
  for (const [, token] of entries) {
    keys.set(token, computeSortKey(token));
  }

  return [...entries].toSorted(([aPath, aTok], [bPath, bTok]) => {
    const cmp = compareValue(aTok, bTok, keys);
    if (cmp !== 0) return sign * cmp;
    // Stable tiebreak on path so the order is deterministic when values equal.
    return sign * aPath.localeCompare(bPath, undefined, { numeric: true });
  });
}

function compareValue(
  a: VirtualToken,
  b: VirtualToken,
  keys: ReadonlyMap<VirtualToken, SortKey>,
): number {
  // When the two tokens differ in $type, fall back to type-alpha so at
  // least the mixed list clusters by type.
  if (a.$type !== b.$type) return String(a.$type ?? '').localeCompare(String(b.$type ?? ''));

  const ak = keys.get(a);
  const bk = keys.get(b);
  if (!ak || !bk) return 0;
  if (ak.kind !== bk.kind) return 0; // matches a.$type === b.$type check above

  if (ak.kind === 'numeric' && bk.kind === 'numeric') {
    if (ak.valid && bk.valid) return ak.value - bk.value;
    if (ak.valid) return -1;
    if (bk.valid) return 1;
    return 0;
  }

  if (ak.kind === 'color' && bk.kind === 'color') {
    const a3 = ak.key;
    const b3 = bk.key;
    if (!a3 && !b3) return 0;
    if (!a3) return 1;
    if (!b3) return -1;
    if (a3.l !== b3.l) return a3.l - b3.l;
    if (a3.c !== b3.c) return a3.c - b3.c;
    return a3.h - b3.h;
  }

  if (ak.kind === 'string' && bk.kind === 'string') {
    return ak.value.localeCompare(bk.value, undefined, { numeric: true });
  }

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
