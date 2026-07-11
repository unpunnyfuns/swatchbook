import type { SwatchbookParameters } from '#/globals.ts';

/**
 * Axis-tuple resolution shared by the preview decorator and the global
 * axis-applier. Pure over an explicit `axes` list (the addon passes its
 * `virtual:swatchbook/tokens` `axes` export) so the resolution rules can be
 * tested without the virtual module or a running preview.
 */

/** Minimal axis shape the resolvers read. Structurally satisfied by the addon's virtual `axes` export. */
export interface ResolveAxis {
  readonly name: string;
  readonly default: string;
  readonly contexts: readonly string[];
}

/** Axis-default tuple — `{ axis.name: axis.default }` for every axis. The baseline before overrides. */
export function axisDefaultTuple(axes: readonly ResolveAxis[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const axis of axes) out[axis.name] = axis.default;
  return out;
}

/**
 * Merge a partial tuple onto the axis defaults: drop keys for axes that don't
 * exist, and fall back to the default for contexts not listed on the axis.
 */
export function normalizeTuple(
  partial: Readonly<Record<string, string>>,
  axes: readonly ResolveAxis[],
): Record<string, string> {
  const out = axisDefaultTuple(axes);
  for (const axis of axes) {
    const candidate = partial[axis.name];
    if (candidate !== undefined && axis.contexts.includes(candidate)) {
      out[axis.name] = candidate;
    }
  }
  return out;
}

/**
 * Resolve the active tuple from all input channels, in priority order:
 *   1. `parameters.swatchbook.axes` — per-story tuple.
 *   2. `globals.swatchbookAxes` — toolbar-set tuple.
 *   3. axis defaults.
 */
export function resolveTuple(
  axesGlobal: Record<string, string> | undefined,
  paramSwatchbook: SwatchbookParameters | undefined,
  axes: readonly ResolveAxis[],
): Record<string, string> {
  const paramAxes = paramSwatchbook?.axes;
  if (paramAxes) {
    return normalizeTuple(paramAxes, axes);
  }
  if (axesGlobal && typeof axesGlobal === 'object') {
    return normalizeTuple(axesGlobal, axes);
  }
  return axisDefaultTuple(axes);
}
