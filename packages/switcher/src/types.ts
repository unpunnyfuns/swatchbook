// Structural types the switcher consumes. Mirror the shapes produced by
// `@unpunnyfuns/swatchbook-core` and by the addon's preview INIT payload —
// re-declared here so the switcher stays framework-agnostic and doesn't pull
// core / addon as runtime deps.

export interface SwitcherAxis {
  name: string;
  contexts: readonly string[];
  default: string;
  description?: string;
  /**
   * Origin of this axis, mirroring `@unpunnyfuns/swatchbook-core`'s internal
   * source classification (see that package's `types.ts`). The literal union
   * is coupled to core's: only `'synthetic'` is read here (to relabel the
   * single-axis fallback as "Permutation"), but consumers commonly pass
   * `Project.axes` straight through, so a new source kind added on the core
   * side is a structural-compatibility change for this field too — the two
   * packages are expected to version in lockstep on this union.
   */
  source?: 'resolver' | 'layered' | 'synthetic';
}

export interface SwitcherPreset {
  name: string;
  axes: Partial<Record<string, string>>;
  description?: string;
}

/**
 * Color-value display formats. Mirrors `@unpunnyfuns/swatchbook-core`'s
 * canonical `ColorFormat` union (see that package's `color-formats.ts`) for
 * the same reason the axis/preset shapes above are re-declared rather than
 * imported: the switcher stays framework-agnostic and doesn't pull `core`
 * as a runtime dependency. `packages/switcher/test/color-format-parity.test.ts`
 * guards this list against drifting from core's.
 */
export type ColorFormat = 'hex' | 'rgb' | 'hsl' | 'oklch' | 'raw';

export const COLOR_FORMATS: readonly ColorFormat[] = ['hex', 'rgb', 'hsl', 'oklch', 'raw'];
