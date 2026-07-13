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

/** Minimal structural view of a CSF-factory story: only the input the helper reads. */
export interface FactoryStory {
  readonly input?: { readonly name?: string };
}

/** Options controlling how a generated axis variant behaves. */
export interface WithAxesOptions {
  /** Add `!dev` so the variant generates a test but stays out of the sidebar. */
  hidden?: boolean;
}

const HIDDEN_TAG = '!dev';

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

// Compact human label for a raw tuple, e.g. `mode: Dark · brand: Brand A`.
function tupleLabel(tuple: Partial<Record<string, string>>): string {
  return Object.entries(tuple)
    .filter((entry): entry is [string, string] => entry[1] !== undefined)
    .map(([axis, context]) => `${axis}: ${context}`)
    .join(' · ');
}

/**
 * Derive a CSF-factory story variant pinned to a resolved, validated axis
 * tuple. Pure over explicit axes/presets lists so it's testable without the
 * virtual module; the public `withAxes` wrapper injects the addon's virtual
 * exports. Reaches `.extend` through a cast so the public generic need not
 * carry a `.extend` signature (a real `extend<TInput>` is not cleanly
 * assignable to a non-generic structural one).
 */
export function buildAxisVariant<TStory extends FactoryStory>(
  base: TStory,
  axesOrPreset: Readonly<Record<string, string>> | string,
  options: WithAxesOptions,
  project: { axes: readonly ResolveAxis[]; presets: readonly ResolvePreset[] },
): TStory {
  const isPreset = typeof axesOrPreset === 'string';
  const tuple = isPreset ? resolvePreset(axesOrPreset, project.presets) : axesOrPreset;
  assertKnownTuple(tuple, project.axes);

  const label = isPreset ? axesOrPreset : tupleLabel(tuple);
  const baseName = base.input?.name;
  const name = baseName ? `${baseName} (${label})` : label;

  const patch: Record<string, unknown> = {
    name,
    parameters: { swatchbook: { axes: tuple } },
  };
  if (options.hidden) {
    patch['tags'] = [HIDDEN_TAG];
  }

  const extendable = base as unknown as { extend(input: Record<string, unknown>): unknown };
  return extendable.extend(patch) as TStory;
}
