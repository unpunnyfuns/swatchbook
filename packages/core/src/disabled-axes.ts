import type { Axis, Diagnostic } from '#/types.ts';

export interface DisabledAxesValidationResult {
  names: string[];
  diagnostics: Diagnostic[];
}

/**
 * Validate + sanitize the user-supplied `config.disabledAxes` list against
 * the project's axes. Unknown axis names produce `warn` diagnostics and are
 * dropped; the surviving names are what gets filtered out of
 * `Project.axes`, `Project.permutations`, and CSS emission.
 *
 * Mirrors the shape of `validatePresets` so the two validation surfaces
 * feel identical to authors reading diagnostics.
 */
export function validateDisabledAxes(
  raw: string[] | undefined,
  axes: Axis[],
): DisabledAxesValidationResult {
  const diagnostics: Diagnostic[] = [];
  if (!raw || raw.length === 0) return { names: [], diagnostics };

  const known = new Set(axes.map((a) => a.name));
  const seen = new Set<string>();
  const names: string[] = [];
  for (const name of raw) {
    if (seen.has(name)) continue;
    seen.add(name);
    if (!known.has(name)) {
      diagnostics.push({
        severity: 'warn',
        group: 'swatchbook/disabled-axes',
        message: `Config \`disabledAxes\` references unknown axis "${name}" — dropped.`,
      });
      continue;
    }
    names.push(name);
  }

  return { names, diagnostics };
}
