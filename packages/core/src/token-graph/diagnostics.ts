import type { Diagnostic } from '#/types.ts';

export function unresolvableAliasDiagnostic(
  axis: string,
  context: string,
  path: string,
  target: string,
): Diagnostic {
  return {
    severity: 'error',
    group: 'swatchbook/token-graph',
    message: `Modifier \`${axis}/${context}\` writes \`${path}\` as alias to \`${target}\`, which is not defined in any modifier or baseline.`,
  };
}

export function buildFailedDiagnostic(detail: string): Diagnostic {
  return {
    severity: 'error',
    group: 'swatchbook/token-graph',
    message: `Graph build failed: ${detail}. \`tokenGraph\` will be empty; \`resolveAt()\` returns baseline-only values.`,
  };
}

export function aliasCycleDiagnostic(path: string, chain: readonly string[]): Diagnostic {
  return {
    severity: 'warn',
    group: 'swatchbook/token-graph',
    message: `Alias cycle starting at \`${path}\` (chain: ${chain.join(' → ')} → ${path}). Walker returns baseline literal at cycle entry.`,
  };
}

export function malformedColorShapeDiagnostic(
  path: string,
  fieldPath: string,
  reason: string,
): Diagnostic {
  const where = fieldPath ? `${path} (at \`${fieldPath}\`)` : path;
  return {
    severity: 'warn',
    group: 'swatchbook/token-graph',
    message: `Color value at \`${where}\` is structurally invalid: ${reason}. CSS emission will fail for any context that resolves to this token.`,
  };
}

export function unresolvedRefDiagnostic(path: string, fieldPath: string, ref: string): Diagnostic {
  const where = fieldPath ? `${path} (at \`${fieldPath}\`)` : path;
  return {
    severity: 'warn',
    group: 'swatchbook/token-graph',
    message: `Unresolved \`$ref\` at \`${where}\`: \`${ref}\`. The upstream DTCG parser did not substitute the target value, so this field will reach CSS emission as a \`{ $ref }\` object literal. Check that the JSON Pointer resolves and that the parser version handles \`$ref\` into non-Object targets (arrays, scalars).`,
  };
}
