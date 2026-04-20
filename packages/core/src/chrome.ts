import type { Diagnostic, TokenMap } from '#/types.ts';

/**
 * Closed set of roles that swatchbook's block chrome reads. Each role emits
 * to a fixed `--swatchbook-<dashform>` custom property that blocks reference
 * directly — independent of the project's `cssVarPrefix`, so there is zero
 * chance of the project's token namespace colliding with chrome reads.
 *
 * Consumers whose tokens don't happen to match these roles supply a
 * `chrome` config entry mapping each role to a token path in their own
 * tree; the CSS emitter appends `:root` aliases of the form
 * `--swatchbook-<role>: var(--<prefix>-<target>);`, so chrome reads resolve
 * through the alias to the consumer's tokens while per-theme value flips
 * ride through the target's existing per-theme emission.
 */
export const CHROME_PATHS = [
  'color.border.default',
  'color.surface.default',
  'color.surface.muted',
  'color.surface.raised',
  'color.text.default',
  'color.text.muted',
  'color.accent.bg',
  'color.accent.fg',
  'typography.body.font-family',
  'typography.body.font-size',
] as const satisfies readonly string[];

export type ChromePath = (typeof CHROME_PATHS)[number];

/** Fixed prefix for chrome CSS custom properties. Independent of project config. */
export const CHROME_VAR_PREFIX = 'swatchbook';

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
