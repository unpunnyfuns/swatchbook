import type { TokenNormalized } from '@terrazzo/parser';
import { generateShorthand, makeCSSVar, transformCSSValue } from '@terrazzo/token-tools/css';
import type { Axis, Theme, TokenMap } from '#/types.ts';

export interface EmitCssOptions {
  /** Override the prefix from project config (default: `config.cssVarPrefix ?? ''`). */
  prefix?: string;
  /**
   * Project axes used to key per-tuple blocks on compound attribute selectors
   * (`[data-mode="Dark"][data-brand="Brand A"] { … }`). When omitted, emission
   * falls back to the legacy single-selector shape keyed on `data-theme`.
   */
  axes?: Axis[];
}

/**
 * Emit a single concatenated stylesheet.
 *
 * With axes supplied, emits a `:root` block carrying the default-tuple values
 * plus one block per non-default cartesian tuple keyed on a compound attribute
 * selector matching `Project.axes` order. Every var is redeclared per tuple
 * (flat emission) — see `docs/decisions.md` for the rationale.
 *
 * For single-axis projects (resolver with one modifier, or synthetic `theme`),
 * emission keeps the familiar `[data-theme="…"]` shape.
 */
export function emitCss(
  themes: Theme[],
  themesResolved: Record<string, TokenMap>,
  options: EmitCssOptions = {},
): string {
  const prefix = options.prefix ?? '';
  const varOpts = prefix ? { prefix } : {};
  const transformAlias = (token: TokenNormalized): string =>
    makeCSSVar(token.id, { ...varOpts, wrapVar: true });

  const axes = options.axes ?? [];
  const multiAxis = axes.length > 1;
  const defaultTuple = buildDefaultTuple(axes);
  const defaultTheme = axes.length > 0 ? findThemeByTuple(themes, defaultTuple) : undefined;

  const blocks: string[] = [];

  if (multiAxis && defaultTheme) {
    const decls = declarationsFor(defaultTheme, themesResolved, varOpts, transformAlias);
    if (decls.length > 0) blocks.push(`:root {\n${decls.join('\n')}\n}`);
  }

  for (const theme of themes) {
    if (multiAxis && theme === defaultTheme) continue;
    const decls = declarationsFor(theme, themesResolved, varOpts, transformAlias);
    if (decls.length === 0) continue;
    blocks.push(`${selectorFor(theme, axes)} {\n${decls.join('\n')}\n}`);
  }

  return `${blocks.join('\n\n')}\n`;
}

type VarOpts = Record<string, never> | { prefix: string };

function declarationsFor(
  theme: Theme,
  themesResolved: Record<string, TokenMap>,
  varOpts: VarOpts,
  transformAlias: (token: TokenNormalized) => string,
): string[] {
  const tokens = themesResolved[theme.name];
  if (!tokens) return [];
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
  return declarations;
}

/**
 * Compose the selector for a tuple. Multi-axis projects get a compound
 * attribute selector in axis order; single-axis projects keep the familiar
 * `[data-theme="…"]` shape so the single-attribute selector stays recognizable.
 */
function selectorFor(theme: Theme, axes: Axis[]): string {
  if (axes.length <= 1) {
    return `[data-theme="${cssEscape(theme.name)}"]`;
  }
  const parts: string[] = [];
  for (const axis of axes) {
    const value = theme.input[axis.name];
    if (value === undefined) continue;
    parts.push(`[data-${axis.name}="${cssEscape(value)}"]`);
  }
  return parts.length > 0 ? parts.join('') : `[data-theme="${cssEscape(theme.name)}"]`;
}

function buildDefaultTuple(axes: Axis[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const axis of axes) out[axis.name] = axis.default;
  return out;
}

function findThemeByTuple(
  themes: Theme[],
  tuple: Readonly<Record<string, string>>,
): Theme | undefined {
  const keys = Object.keys(tuple);
  return themes.find((theme) => {
    for (const key of keys) {
      if (theme.input[key] !== tuple[key]) return false;
    }
    return Object.keys(theme.input).length === keys.length;
  });
}

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

/** Escape `"` and `\` so attribute values sit safely inside `[attr="…"]`. */
function cssEscape(name: string): string {
  return name.replaceAll('\\', '\\\\').replaceAll('"', '\\"');
}
