/**
 * Pure core for `withAxes` (see `#/testing.ts`). Kept free of the
 * `virtual:swatchbook/tokens` import so the resolution + validation rules are
 * unit-testable without the virtual module, mirroring `#/tuple-resolve.ts`.
 */

import type { ResolveAxis } from '#/tuple-resolve.ts';

/** Named axis combination the resolver reads. Structurally satisfied by the addon's virtual `presets` export. */
export interface ResolvePreset {
  readonly name: string;
  readonly axes: Partial<Record<string, string>>;
}

/** The `.extend()` input `withAxes` produces: a swatchbook axis override, nothing else. */
export interface AxisVariantInput {
  parameters: { swatchbook: { axes: Partial<Record<string, string>> } };
}

/** Resolve a preset name to its partial axes tuple; throw if no preset carries that name. */
export function resolvePreset(
  name: string,
  presets: readonly ResolvePreset[],
): Partial<Record<string, string>> {
  const match = presets.find((preset) => preset.name === name);
  if (!match) {
    const known = presets.map((preset) => preset.name).join(', ') || '(none)';
    throw new Error(`withAxes: unknown preset "${name}". Known presets: ${known}.`);
  }
  return match.axes;
}

/**
 * Throw if any key isn't a known axis or any value isn't one of that axis's
 * contexts. Stricter than `normalizeTuple`, whose silent fall-back to defaults
 * would let a typo pass as a green test running the wrong tuple.
 */
export function assertKnownTuple(
  tuple: Partial<Record<string, string>>,
  axes: readonly ResolveAxis[],
): void {
  for (const [key, value] of Object.entries(tuple)) {
    const axis = axes.find((candidate) => candidate.name === key);
    if (!axis) {
      const known = axes.map((candidate) => candidate.name).join(', ') || '(none)';
      throw new Error(`withAxes: unknown axis "${key}". Known axes: ${known}.`);
    }
    if (value !== undefined && !axis.contexts.includes(value)) {
      throw new Error(
        `withAxes: "${value}" is not a context of axis "${key}". Known contexts: ${axis.contexts.join(', ')}.`,
      );
    }
  }
}

/**
 * Build the `.extend()` input that pins a CSF-factory story variant to a
 * resolved, validated axis tuple. Pure over explicit axes/presets lists so it's
 * testable without the virtual module; the public `withAxes` wrapper injects the
 * addon's virtual exports.
 */
export function buildAxisInput(
  axesOrPreset: Readonly<Record<string, string>> | string,
  project: { axes: readonly ResolveAxis[]; presets: readonly ResolvePreset[] },
): AxisVariantInput {
  const tuple =
    typeof axesOrPreset === 'string' ? resolvePreset(axesOrPreset, project.presets) : axesOrPreset;
  assertKnownTuple(tuple, project.axes);
  return { parameters: { swatchbook: { axes: tuple } } };
}
