import { resolveCssVar, useProject } from '#/internal/use-project.ts';

export interface DetailToken {
  $type?: string;
  $value?: unknown;
  $description?: string;
  aliasOf?: string;
  aliasChain?: readonly string[];
  aliasedBy?: readonly string[];
  /**
   * Terrazzo-populated sub-value alias map for composite tokens. Shape
   * varies by $type: object-valued composites (`border`, `typography`,
   * `transition`) use `Record<string, string | undefined>` keyed by
   * sub-key; array-valued composites (`shadow`, `gradient`) use an array
   * of such records indexed per layer / stop. Carried through `unknown`
   * here so each consumer narrows at use-site.
   */
  partialAliasOf?: unknown;
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
  const project = useProject();
  const { activeTheme, activeAxes, axes, themes, themesResolved, resolved, cssVarPrefix } = project;
  const typedResolved = resolved as Record<string, DetailToken>;
  return {
    token: typedResolved[path],
    cssVar: resolveCssVar(path, project),
    activeTheme,
    activeAxes,
    axes,
    themes,
    themesResolved: themesResolved as Record<string, Record<string, DetailToken>>,
    resolved: typedResolved,
    cssVarPrefix,
  };
}
