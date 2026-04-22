import type { Axis, Theme, TokenMap } from '#/types.ts';

/**
 * Classify how a token's resolved value depends on the project's axes.
 * Compares every pair of themes that differ in exactly one axis; if any
 * such pair resolves to a different value, that axis is marked as
 * varying.
 *
 * The comparison key is the structural `JSON.stringify($value)` — so
 * axis variance doesn't change with the reader's colour-format display
 * preference, and composite tokens (shadow, typography, …) compare on
 * every sub-field.
 *
 * Missing tokens (path not in any theme) classify as `constant` with
 * empty `varyingAxes` — the token doesn't exist to vary. Callers that
 * want to distinguish "missing" from "constant present" should check
 * project resolution before calling.
 */

export type VarianceKind = 'constant' | 'single' | 'multi';

export interface AxisVarianceResult {
  path: string;
  kind: VarianceKind;
  /** Axes whose contexts change this token's resolved value. */
  varyingAxes: string[];
  /** Axes whose contexts do not change the resolved value. */
  constantAcrossAxes: string[];
  /**
   * Per-axis breakdown. For each axis, whether it affects this token,
   * and the stringified value seen in each of its contexts (holding
   * other axes at their defaults).
   */
  perAxis: Record<
    string,
    {
      varying: boolean;
      contexts: Record<string, string>;
    }
  >;
}

export function analyzeAxisVariance(
  path: string,
  axes: readonly Axis[],
  themes: readonly Theme[],
  themesResolved: Record<string, TokenMap>,
): AxisVarianceResult {
  const varyingAxes: string[] = [];
  const constantAcrossAxes: string[] = [];
  const perAxis: AxisVarianceResult['perAxis'] = {};

  for (const axis of axes) {
    // Bucket themes by their tuple-minus-this-axis. If any bucket holds
    // two contexts for this axis whose resolved values differ, the axis
    // affects this token.
    const byOtherAxes = new Map<string, Map<string, string>>();
    for (const theme of themes) {
      const others = axes
        .filter((a) => a.name !== axis.name)
        .map((a) => `${a.name}=${theme.input[a.name] ?? ''}`)
        .join('|');
      const ctx = theme.input[axis.name] ?? '';
      const bucket = byOtherAxes.get(others) ?? new Map<string, string>();
      bucket.set(ctx, valueKey(themesResolved, theme.name, path));
      byOtherAxes.set(others, bucket);
    }

    let varying = false;
    for (const bucket of byOtherAxes.values()) {
      if (new Set(bucket.values()).size > 1) {
        varying = true;
        break;
      }
    }

    // Context breakdown: hold other axes at their defaults, iterate this
    // axis. Reuses `themesResolved`; doesn't re-run the loader.
    const defaultTuple: Record<string, string> = {};
    for (const a of axes) defaultTuple[a.name] = a.default;
    const contexts: Record<string, string> = {};
    for (const ctx of axis.contexts) {
      const probe = { ...defaultTuple, [axis.name]: ctx };
      const theme = themes.find((t) => {
        for (const a of axes) {
          if (t.input[a.name] !== probe[a.name]) return false;
        }
        return true;
      });
      contexts[ctx] = theme ? valueKey(themesResolved, theme.name, path) : '';
    }

    perAxis[axis.name] = { varying, contexts };
    (varying ? varyingAxes : constantAcrossAxes).push(axis.name);
  }

  const kind: VarianceKind =
    varyingAxes.length === 0 ? 'constant' : varyingAxes.length === 1 ? 'single' : 'multi';

  return { path, kind, varyingAxes, constantAcrossAxes, perAxis };
}

/**
 * Stable key for variance comparison. Uses `JSON.stringify($value)` so
 * the key reflects structural equality — composite tokens compare on
 * every sub-field, primitives compare by their normalised `$value`
 * shape.
 */
function valueKey(
  themesResolved: Record<string, TokenMap>,
  themeName: string,
  path: string,
): string {
  const token = themesResolved[themeName]?.[path];
  if (!token) return '';
  return JSON.stringify(token.$value);
}
