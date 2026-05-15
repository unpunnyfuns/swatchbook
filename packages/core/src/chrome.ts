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
export const CHROME_ROLES = [
  'borderDefault',
  'surfaceDefault',
  'surfaceMuted',
  'surfaceRaised',
  'textDefault',
  'textMuted',
  'accentBg',
  'accentFg',
  'bodyFontFamily',
  'bodyFontSize',
] as const satisfies readonly string[];

export type ChromeRole = (typeof CHROME_ROLES)[number];

/** Fixed prefix for chrome CSS custom properties. Independent of project config. */
export const CHROME_VAR_PREFIX = 'swatchbook';

/**
 * Hard-coded literal CSS values for each chrome role. Used as the baseline
 * for every project — the CSS emitter always declares all ten chrome vars,
 * starting from these defaults and overlaying any user-supplied `chrome`
 * entry as a `var(...)` reference on top.
 *
 * Color roles use the `light-dark()` CSS function so zero-config chrome
 * auto-flips with the active `color-scheme` (which Storybook's preview
 * iframe, MDX docs pages, the OS prefers-color-scheme chain, etc. all
 * participate in). The emitter tags the chrome `:root` block with
 * `color-scheme: light dark` so the function resolves correctly even when
 * no parent element opts in. `light-dark()` is supported in Chrome 123+,
 * Firefox 120+, and Safari 17.5+ — all evergreen.
 *
 * Values chosen for WCAG AA contrast in both modes. Consumers theme chrome
 * against their own tokens by filling `config.chrome`.
 */
export const DEFAULT_CHROME_MAP: Record<ChromeRole, string> = {
  surfaceDefault: 'light-dark(#ffffff, #0f172a)',
  surfaceMuted: 'light-dark(#f4f4f5, #1e293b)',
  surfaceRaised: 'light-dark(#ffffff, #111827)',
  textDefault: 'light-dark(#111827, #f1f5f9)',
  textMuted: 'light-dark(#4b5563, #94a3b8)',
  borderDefault: 'light-dark(#e5e7eb, #334155)',
  accentBg: 'light-dark(#1d4ed8, #3b82f6)',
  accentFg: 'light-dark(#ffffff, #0b1220)',
  bodyFontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  bodyFontSize: '14px',
};

export interface ChromeValidationResult {
  entries: Record<string, string>;
  diagnostics: Diagnostic[];
}

/**
 * Validate `config.chrome` against the project's resolved tokens. Unknown
 * roles (outside `CHROME_ROLES`) and target paths that don't resolve in any
 * theme produce `warn` diagnostics and are dropped. Surviving entries land
 * on `Project.chrome` and override the hard-coded `DEFAULT_CHROME_MAP`
 * literals during CSS emission.
 */
export function validateChrome(
  raw: Record<string, string> | undefined,
  permutationsResolved: Record<string, TokenMap>,
): ChromeValidationResult {
  const diagnostics: Diagnostic[] = [];
  if (!raw) return { entries: {}, diagnostics };

  const known = new Set<string>(CHROME_ROLES);
  const tokenIDs = new Set<string>();
  for (const tokens of Object.values(permutationsResolved)) {
    for (const id of Object.keys(tokens)) tokenIDs.add(id);
  }

  const entries: Record<string, string> = {};
  for (const [role, target] of Object.entries(raw)) {
    if (!known.has(role)) {
      diagnostics.push({
        severity: 'warn',
        group: 'swatchbook/chrome',
        message: `\`chrome\` references unknown role "${role}" — dropped. Known roles: ${CHROME_ROLES.join(', ')}.`,
      });
      continue;
    }
    if (!targetResolves(target, tokenIDs)) {
      diagnostics.push({
        severity: 'warn',
        group: 'swatchbook/chrome',
        message: `\`chrome\` maps "${role}" → "${target}" but "${target}" is not a token or composite sub-field in any theme — dropped.`,
      });
      continue;
    }
    entries[role] = target;
  }

  return { entries, diagnostics };
}

/**
 * A target resolves if it's either a direct token ID, or a composite
 * sub-field under one (`typography.body.font-family` under the composite
 * `typography.body`). Composite tokens emit one CSS var per sub-field,
 * so either form is a valid alias target.
 */
function targetResolves(target: string, tokenIDs: Set<string>): boolean {
  if (tokenIDs.has(target)) return true;
  const lastDot = target.lastIndexOf('.');
  if (lastDot < 0) return false;
  return tokenIDs.has(target.slice(0, lastDot));
}
