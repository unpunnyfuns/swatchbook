import { makeCSSVar } from '@terrazzo/token-tools/css';
import type { Diagnostic } from '#/types.ts';

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
] as const satisfies readonly string[];

export type ChromeRole = (typeof CHROME_ROLES)[number];

/** Fixed prefix for chrome CSS custom properties. Independent of project config. */
export const CHROME_VAR_PREFIX = 'swatchbook';

/**
 * Hard-coded literal CSS values for each chrome role. Used as the baseline
 * for every project — the CSS emitter always declares all nine chrome vars,
 * starting from these defaults and overlaying any user-supplied `chrome`
 * entry as a `var(...)` reference on top.
 *
 * Single owned literal values. Swatchbook has no intrinsic dark axis, so the
 * zero-config default is one committed appearance; per-axis variation comes
 * from `config.chrome` mapping roles to the consumer's tokens. No
 * `light-dark()` or system colors — those couple to the OS color-scheme,
 * which is foreign to swatchbook's axis model.
 *
 * Values meet WCAG AA on their respective surfaces. Consumers theme chrome
 * against their own tokens by filling `config.chrome`.
 */
export const DEFAULT_CHROME_MAP: Record<ChromeRole, string> = {
  surfaceDefault: '#ffffff',
  surfaceMuted: '#f4f4f5',
  surfaceRaised: '#ffffff',
  textDefault: '#111827',
  textMuted: '#4b5563',
  borderDefault: '#e5e7eb',
  accentBg: '#1d4ed8',
  accentFg: '#ffffff',
  bodyFontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
};

/**
 * The chrome defaults as a standalone `:root` stylesheet block. Shipped by the
 * blocks as a bundled base layer so `--swatchbook-*` is defined without the
 * addon. The emitter produces a superset of this (defaults + consumer
 * overrides) that wins via source order when the addon is present.
 */
export function buildChromeDefaultsCss(): string {
  const lines = CHROME_ROLES.map(
    (role) => `  ${makeCSSVar(role, { prefix: CHROME_VAR_PREFIX })}: ${DEFAULT_CHROME_MAP[role]};`,
  );
  return `:root {\n${lines.join('\n')}\n}`;
}

export interface ChromeValidationResult {
  entries: Record<string, string>;
  diagnostics: Diagnostic[];
}

/**
 * Validate `config.chrome` against the project's known token paths.
 * Unknown roles (outside `CHROME_ROLES`) and target paths that don't
 * appear in any theme produce `warn` diagnostics and are dropped.
 * Surviving entries land on `Project.chrome` and override the
 * hard-coded `DEFAULT_CHROME_MAP` literals during CSS emission.
 *
 * Caller pre-computes `tokenIDs` (typically from `listPaths(project.tokenGraph)`)
 * so this function doesn't reach into the resolver directly.
 */
export function validateChrome(
  raw: Record<string, string> | undefined,
  tokenIDs: ReadonlySet<string>,
): ChromeValidationResult {
  const diagnostics: Diagnostic[] = [];
  if (!raw) return { entries: {}, diagnostics };

  const known = new Set<string>(CHROME_ROLES);

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

// A target resolves if it's either a direct token ID, or a composite
// sub-field under one (`typography.body.font-family` under the composite
// `typography.body`). Composite tokens emit one CSS var per sub-field,
// so either form is a valid alias target.
function targetResolves(target: string, tokenIDs: ReadonlySet<string>): boolean {
  if (tokenIDs.has(target)) return true;
  const lastDot = target.lastIndexOf('.');
  if (lastDot < 0) return false;
  return tokenIDs.has(target.slice(0, lastDot));
}
