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

export function fixpointNotStableDiagnostic(path: string, iterations: number): Diagnostic {
  return {
    severity: 'error',
    group: 'swatchbook/token-graph',
    message: `affectedBy fixpoint did not stabilize for \`${path}\` after ${iterations} iterations — likely a pathological graph shape.`,
  };
}

export function buildFailedDiagnostic(detail: string): Diagnostic {
  return {
    severity: 'error',
    group: 'swatchbook/token-graph',
    message: `Graph build failed: ${detail}. \`tokenGraph\` will be empty; \`resolveAt()\` returns baseline-only values.`,
  };
}

export function dualPathMismatchDiagnostic(
  path: string,
  tuple: Record<string, string>,
  graphValue: unknown,
  resolverValue: unknown,
): Diagnostic {
  return {
    severity: 'warn',
    group: 'swatchbook/token-graph',
    message: `Graph walk for \`${path}\` at \`${JSON.stringify(tuple)}\` resolved to \`${JSON.stringify(graphValue)}\`, but resolver.apply produced \`${JSON.stringify(resolverValue)}\`. Possible structural bug in buildTokenGraph — please file an issue.`,
  };
}

export function aliasCycleDiagnostic(path: string, chain: readonly string[]): Diagnostic {
  return {
    severity: 'warn',
    group: 'swatchbook/token-graph',
    message: `Alias cycle starting at \`${path}\` (chain: ${chain.join(' → ')} → ${path}). Walker returns baseline literal at cycle entry.`,
  };
}
