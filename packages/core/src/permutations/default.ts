import type { Axis, Diagnostic } from '#/types.ts';

export interface DefaultTupleResult {
  tuple: Record<string, string>;
  diagnostics: Diagnostic[];
}

/**
 * Resolve the project's starting tuple by merging the author-supplied
 * `config.default` onto the axis-default baseline. Unknown axis keys and
 * invalid context values surface as `warn` diagnostics (group
 * `swatchbook/default`) and the offending entry is dropped; the axis's own
 * `default` fills in. When `explicit` is absent the result is exactly the
 * axis-default baseline.
 */
export function resolveDefaultTuple(
  explicit: Partial<Record<string, string>> | undefined,
  axes: Axis[],
): DefaultTupleResult {
  const tuple: Record<string, string> = {};
  for (const axis of axes) tuple[axis.name] = axis.default;

  const diagnostics: Diagnostic[] = [];
  if (!explicit) return { tuple, diagnostics };

  const axisByName = new Map<string, Axis>();
  for (const axis of axes) axisByName.set(axis.name, axis);

  for (const [axisName, ctx] of Object.entries(explicit)) {
    if (ctx === undefined) continue;
    const axis = axisByName.get(axisName);
    if (!axis) {
      diagnostics.push({
        severity: 'warn',
        group: 'swatchbook/default',
        message: `Config "default" references unknown axis "${axisName}" — using axis defaults.`,
      });
      continue;
    }
    if (!axis.contexts.includes(ctx)) {
      diagnostics.push({
        severity: 'warn',
        group: 'swatchbook/default',
        message: `Config "default" sets axis "${axisName}" to "${ctx}" which isn't a known context (${axis.contexts.join(', ')}) — using axis default.`,
      });
      continue;
    }
    tuple[axisName] = ctx;
  }
  return { tuple, diagnostics };
}
