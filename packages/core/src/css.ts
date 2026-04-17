import type { TokenNormalized } from '@terrazzo/parser';
import { generateShorthand, makeCSSVar, transformCSSValue } from '@terrazzo/token-tools/css';
import type { Theme, TokenMap } from '#/types.ts';

export interface EmitCssOptions {
  /** Override the prefix from project config (default: `config.cssVarPrefix ?? ''`). */
  prefix?: string;
}

/**
 * Emit a single concatenated stylesheet with one `[data-theme="…"]` block per
 * theme. Consumers toggle `data-theme` on an ancestor (typically `<html>`) to
 * flip the active palette; the browser handles the repaint.
 */
export function emitCss(
  themes: Theme[],
  themesResolved: Record<string, TokenMap>,
  options: EmitCssOptions = {},
): string {
  const prefix = options.prefix ?? '';
  const varOpts = prefix ? { prefix } : {};
  // Custom alias transform so var(--...) references inside composite values
  // pick up our prefix (Terrazzo's default doesn't know about it).
  const transformAlias = (token: TokenNormalized): string =>
    makeCSSVar(token.id, { ...varOpts, wrapVar: true });

  const blocks: string[] = [];

  for (const theme of themes) {
    const tokens = themesResolved[theme.name];
    if (!tokens) continue;

    const declarations: string[] = [];
    for (const [localID, token] of Object.entries(tokens)) {
      for (const decl of emitTokenDeclarations(
        localID,
        token,
        tokens,
        theme.input,
        varOpts,
        transformAlias,
      )) {
        declarations.push(`  ${decl}`);
      }
    }

    if (declarations.length === 0) continue;

    blocks.push(`[data-theme="${cssEscape(theme.name)}"] {\n${declarations.join('\n')}\n}`);
  }

  return `${blocks.join('\n\n')}\n`;
}

type VarOpts = Record<string, never> | { prefix: string };

function emitTokenDeclarations(
  localID: string,
  token: TokenNormalized,
  tokensSet: TokenMap,
  permutation: Record<string, string>,
  varOpts: VarOpts,
  transformAlias: (token: TokenNormalized) => string,
): string[] {
  const varName = makeCSSVar(localID, varOpts);

  const value = transformCSSValue(token, { tokensSet, permutation, transformAlias });

  if (typeof value === 'string') {
    return [`${varName}: ${value};`];
  }

  // Multi-value composite (typography, shadow, border, transition, gradient).
  // Emit one sub-var per entry, plus a shorthand declaration where possible.
  const lines: string[] = [];
  for (const [subKey, subVal] of Object.entries(value)) {
    const subName = makeCSSVar(`${localID}.${subKey}`, varOpts);
    lines.push(`${subName}: ${subVal};`);
  }
  const shorthand = generateShorthand({ token, localID });
  if (shorthand) {
    lines.push(`${varName}: ${shorthand};`);
  }
  return lines;
}

/** Escape `"` in theme names so they can safely appear inside `[data-theme="…"]`. */
function cssEscape(name: string): string {
  return name.replaceAll('\\', '\\\\').replaceAll('"', '\\"');
}
