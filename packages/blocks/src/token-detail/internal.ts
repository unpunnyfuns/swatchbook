import { makeCssVar, useProject } from '#/internal/use-project.ts';

export interface DetailToken {
  $type?: string;
  $value?: unknown;
  $description?: string;
  aliasOf?: string;
  aliasChain?: readonly string[];
  aliasedBy?: readonly string[];
}

export interface VirtualAxisLike {
  readonly name: string;
  readonly contexts: readonly string[];
  readonly default: string;
  readonly source: 'resolver' | 'layered' | 'synthetic';
}

export interface VirtualThemeLike {
  readonly name: string;
  readonly input: Record<string, string>;
}

export interface TokenDetailData {
  token: DetailToken | undefined;
  cssVar: string;
  activeTheme: string;
  activeAxes: Record<string, string>;
  axes: readonly VirtualAxisLike[];
  themes: readonly VirtualThemeLike[];
  themesResolved: Record<string, Record<string, DetailToken>>;
  resolved: Record<string, DetailToken>;
  cssVarPrefix: string;
}

export function useTokenDetailData(path: string): TokenDetailData {
  const { activeTheme, activeAxes, axes, themes, themesResolved, resolved, cssVarPrefix } =
    useProject();
  const typedResolved = resolved as Record<string, DetailToken>;
  return {
    token: typedResolved[path],
    cssVar: makeCssVar(path, cssVarPrefix),
    activeTheme,
    activeAxes,
    axes,
    themes,
    themesResolved: themesResolved as Record<string, Record<string, DetailToken>>,
    resolved: typedResolved,
    cssVarPrefix,
  };
}
