import type { Diagnostic, TokenMap } from '#/types.ts';

/**
 * Closed set of token paths that swatchbook's block chrome reads. Consumers
 * whose projects don't expose these paths natively can supply a `chrome`
 * config entry mapping each path to a path in their own token tree — the CSS
 * emitter then emits `:root` aliases that redirect chrome's reads to the
 * consumer's tokens.
 *
 * Must stay in lockstep with `CHROME_VARS` in
 * `packages/blocks/src/internal/data-attr.ts`.
 */
export const CHROME_PATHS = [
  'color.sys.border.default',
  'color.sys.surface.default',
  'color.sys.surface.muted',
  'color.sys.surface.raised',
  'color.sys.text.default',
  'color.sys.text.muted',
  'color.sys.accent.bg',
  'color.sys.accent.fg',
  'typography.sys.body.font-family',
  'typography.sys.body.font-size',
] as const satisfies readonly string[];

export type ChromePath = (typeof CHROME_PATHS)[number];

export interface ChromeValidationResult {
  entries: Record<string, string>;
  diagnostics: Diagnostic[];
}

/**
 * Validate `config.chrome` against the project's resolved tokens. Unknown
 * source keys (outside `CHROME_PATHS`) and target paths that don't resolve
 * in any theme produce `warn` diagnostics and are dropped. Surviving entries
 * flow into CSS emission as `:root` alias declarations.
 */
export function validateChrome(
  raw: Record<string, string> | undefined,
  themesResolved: Record<string, TokenMap>,
): ChromeValidationResult {
  const diagnostics: Diagnostic[] = [];
  if (!raw) return { entries: {}, diagnostics };

  const known = new Set<string>(CHROME_PATHS);
  const targetExists = new Set<string>();
  for (const tokens of Object.values(themesResolved)) {
    for (const id of Object.keys(tokens)) targetExists.add(id);
  }

  const entries: Record<string, string> = {};
  for (const [source, target] of Object.entries(raw)) {
    if (!known.has(source)) {
      diagnostics.push({
        severity: 'warn',
        group: 'swatchbook/chrome',
        message: `\`chrome\` references unknown source path "${source}" — dropped. Known paths: ${CHROME_PATHS.join(', ')}.`,
      });
      continue;
    }
    if (!targetExists.has(target)) {
      diagnostics.push({
        severity: 'warn',
        group: 'swatchbook/chrome',
        message: `\`chrome\` maps "${source}" → "${target}" but "${target}" is not a token in any theme — dropped.`,
      });
      continue;
    }
    entries[source] = target;
  }

  return { entries, diagnostics };
}
