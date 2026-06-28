import { parseColor } from '@unpunnyfuns/swatchbook-core/format-color';
import type { VirtualToken } from '#/types.ts';

export type SortBy = 'path' | 'value' | 'none';
export type SortDir = 'asc' | 'desc';

export interface SortOptions {
  by?: SortBy;
  dir?: SortDir;
  /**
   * Root font-size (px) used to convert `rem` dimension values to a pixel
   * magnitude for `by: 'value'`. Defaults to 16. Dimension-bearing blocks
   * pass the measured rendering-context root so a value sort matches the
   * rendered sizes; the same `rem` resolves differently under a different
   * root (a Storybook Docs page vs the canvas).
   */
  rootFontSizePx?: number;
}

type Entry = readonly [string, VirtualToken];

// Stable sort for a filtered `[path, token][]` list.
//
// `sortBy: 'path'` — lexicographic on the dot-path (locale-aware, numeric).
// `sortBy: 'value'` — per-`$type` ordering:
//   - `dimension` / `duration` → numeric pixels / ms (via `toMagnitude`).
//   - `fontWeight` / `opacity` / `number` / `lineHeight` → numeric.
//   - `color` → perceptual by oklch L → C → H.
//   - `fontFamily` / `strokeStyle` (string form) → lexicographic.
//   - Composites (`typography`, `shadow`, `border`, `gradient`, `transition`) →
//     fall back to path-alpha. No useful single-axis order.
// `sortBy: 'none'` — preserve input order (still respects `sortDir: 'desc'`
//   as a reverse).

// Pre-computed per-token sort key — one of three shapes depending on
// `$type`. The comparator looks the key up by token-reference once
// per pair instead of recomputing on every comparison (Schwartzian
// transform).
//
// For N tokens, sort does O(N log N) comparisons; per-call cost for
// colors is an Oklch conversion (a `new Color()` + `to('oklch')`)
// which dominates wall time on real fixtures. Pre-computing brings
// that down to O(N) keys + O(N log N) cheap lookups.
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

function computeSortKey(token: VirtualToken, rootFontSizePx: number): SortKey {
  const type = token.$type;
  if (!type) return { kind: 'none' };
  if (NUMERIC_TYPES.has(type)) {
    const value = toMagnitude(token.$value, rootFontSizePx);
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
  const rootFontSizePx = options.rootFontSizePx ?? 16;
  const keys = new Map<VirtualToken, SortKey>();
  for (const [, token] of entries) {
    keys.set(token, computeSortKey(token, rootFontSizePx));
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
  // Matches the `a.$type === b.$type` check above.
  if (ak.kind !== bk.kind) return 0;

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

function toMagnitude(v: unknown, rootFontSizePx: number): number {
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
        return d.value * rootFontSizePx;
      // `em` is not a DTCG dimension unit (px | rem); it falls through to its
      // raw value rather than being scaled.
      default:
        return d.value;
    }
  }
  return Number.NaN;
}

// Coerce a possibly-null/undefined number to 0 — `coords` returns
// `(number | null)[]` and `noUncheckedIndexedAccess` adds `undefined`
// on top. `typeof` narrows the union for the comparator below.
function safeNumber(v: number | null | undefined): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : 0;
}

function colorKey(v: unknown): { l: number; c: number; h: number } | null {
  // parseColor applies the colorjs space-alias map, so wide-gamut spaces
  // (display-p3, a98-rgb, prophoto-rgb) yield a perceptual key instead of
  // throwing and sinking the token to the end of a value sort.
  const color = parseColor(v);
  if (!color) return null;
  try {
    const [l, chroma, h] = color.to('oklch').coords;
    return { l: safeNumber(l), c: safeNumber(chroma), h: safeNumber(h) };
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
