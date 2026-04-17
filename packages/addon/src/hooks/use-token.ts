import { cssVarPrefix, defaultTheme, themesResolved } from 'virtual:swatchbook/tokens';
import { useActiveTheme } from '#/theme-context.ts';

/**
 * Consumers augment this interface (via the addon's generated
 * `.swatchbook/tokens.d.ts`) to narrow {@link useToken}'s first parameter
 * to their project's actual token paths. Without augmentation it's empty
 * and {@link TokenPath} falls back to `string`.
 */
export interface SwatchbookTokenMap {}

type KnownPath = keyof SwatchbookTokenMap;

/** Union of known token paths, or `string` when the addon codegen hasn't run. */
export type TokenPath = [KnownPath] extends [never] ? string : KnownPath;

export interface TokenInfo {
  /** The resolved DTCG `$value`. Shape varies by `$type`. */
  value: unknown;
  /** `var(--prefix-token-path)` reference, ready to drop into any CSS value. */
  cssVar: string;
  /** DTCG `$type` of the token, if known. */
  type?: string;
  /** Optional DTCG `$description`. */
  description?: string;
}

interface ResolvedToken {
  $value?: unknown;
  $type?: string;
  $description?: string;
}

function makeCssVar(path: string, prefix: string): string {
  const tail = path.replaceAll('.', '-');
  return prefix ? `var(--${prefix}-${tail})` : `var(--${tail})`;
}

/**
 * Read a DTCG token for the currently active theme. Re-reads on theme
 * switch via the addon's `ThemeContext`. Returns `{ value, cssVar, type,
 * description }`.
 *
 * Typed paths appear automatically once `.swatchbook/tokens.d.ts` is
 * generated (happens on first storybook start/build). Until then
 * `TokenPath` is `string`.
 *
 * Safe to call in autodocs / MDX renders — uses plain React context, not
 * Storybook's preview-only hooks.
 */
export function useToken(path: TokenPath): TokenInfo {
  const contextTheme = useActiveTheme();
  const themeName = contextTheme || (defaultTheme ?? '');
  const tokens = (themesResolved[themeName] ?? {}) as Record<string, ResolvedToken>;
  const token = tokens[path];
  const info: TokenInfo = {
    value: token?.$value,
    cssVar: makeCssVar(path, cssVarPrefix),
  };
  if (token?.$type) info.type = token.$type;
  if (token?.$description) info.description = token.$description;
  return info;
}
