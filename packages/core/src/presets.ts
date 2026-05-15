import type { Axis, Diagnostic, Preset } from '#/types.ts';

export interface PresetValidationResult {
  presets: Preset[];
  diagnostics: Diagnostic[];
}

/**
 * Validate + sanitize user-authored presets against the project's axes.
 * Unknown axis keys and invalid context values produce `warn` diagnostics;
 * the offending entries are stripped but the preset itself is kept (possibly
 * empty, which is still a valid tuple — it just resolves to all defaults).
 */
export function validatePresets(raw: Preset[] | undefined, axes: Axis[]): PresetValidationResult {
  const diagnostics: Diagnostic[] = [];
  if (!raw || raw.length === 0) return { presets: [], diagnostics };

  const axisByName = new Map<string, Axis>();
  for (const axis of axes) axisByName.set(axis.name, axis);

  const presets: Preset[] = raw.map((preset) => {
    const sanitized: Partial<Record<string, string>> = {};
    for (const [axisName, ctx] of Object.entries(preset.axes)) {
      if (ctx === undefined) continue;
      const axis = axisByName.get(axisName);
      if (!axis) {
        diagnostics.push({
          severity: 'warn',
          group: 'swatchbook/presets',
          message: `Preset "${preset.name}" references unknown axis "${axisName}" — dropped.`,
        });
        continue;
      }
      if (!axis.contexts.includes(ctx)) {
        diagnostics.push({
          severity: 'warn',
          group: 'swatchbook/presets',
          message: `Preset "${preset.name}" sets axis "${axisName}" to "${ctx}" which isn't a known context (${axis.contexts.join(', ')}) — dropped.`,
        });
        continue;
      }
      sanitized[axisName] = ctx;
    }
    const out: Preset = { name: preset.name, axes: sanitized };
    if (preset.description !== undefined) out.description = preset.description;
    return out;
  });

  return { presets, diagnostics };
}

/**
 * Fill a preset's sanitized partial tuple with each axis's `default`,
 * yielding a complete tuple that names every axis. Matches what the
 * toolbar's "apply preset" button sends out — keeps emitted output and
 * runtime activation in lockstep.
 */
export function fillPresetTuple(
  presetAxes: Partial<Record<string, string>>,
  axes: readonly Axis[],
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const axis of axes) {
    out[axis.name] = presetAxes[axis.name] ?? axis.default;
  }
  return out;
}
