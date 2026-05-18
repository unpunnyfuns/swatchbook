import type { SwitcherAxis, SwitcherPreset } from '#/types.ts';

/**
 * Compose a preset's sanitized partial tuple with the axis defaults, so
 * applying a preset that only names some axes leaves the omitted ones at
 * their defaults (not blank). Mirrors the addon preview decorator's own
 * fallback logic so what a host sends out is what the decorator honors.
 */
export function presetTuple(
  preset: SwitcherPreset,
  axes: readonly SwitcherAxis[],
  defaults: Readonly<Record<string, string>>,
): Record<string, string> {
  const out: Record<string, string> = { ...defaults };
  for (const axis of axes) {
    const candidate = preset.axes[axis.name];
    if (candidate !== undefined && axis.contexts.includes(candidate)) {
      out[axis.name] = candidate;
    }
  }
  return out;
}
