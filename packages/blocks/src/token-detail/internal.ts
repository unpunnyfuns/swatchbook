import type { Axis, AxisVarianceResult } from '@unpunnyfuns/swatchbook-core';
import { resolveCssVar, useProject } from '#/internal/use-project.ts';

type VirtualVarianceByPathShape = Record<string, AxisVarianceResult>;

export interface DetailToken {
  $type?: string;
  $value?: unknown;
  $description?: string;
  $deprecated?: string | boolean;
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

export interface TokenDetailData {
  token: DetailToken | undefined;
  cssVar: string;
  activeTheme: string;
  activeAxes: Record<string, string>;
  axes: readonly Axis[];
  resolved: Record<string, DetailToken>;
  cssVarPrefix: string;
  varianceByPath: VirtualVarianceByPathShape;
  /**
   * Pure-function accessor that composes the resolved tokens for any
   * tuple of axis selections — used by the `AxisVariance` grid to
   * read per-cell values without indexing `permutationsResolved` by
   * a derived tuple name.
   */
  resolveAt: (tuple: Record<string, string>) => Record<string, DetailToken>;
}

export function useTokenDetailData(path: string): TokenDetailData {
  const project = useProject();
  const { activeTheme, activeAxes, axes, resolved, cssVarPrefix, varianceByPath, resolveAt } =
    project;
  const typedResolved = resolved as Record<string, DetailToken>;
  return {
    token: typedResolved[path],
    cssVar: resolveCssVar(path, project),
    activeTheme,
    activeAxes,
    axes,
    resolved: typedResolved,
    cssVarPrefix,
    varianceByPath,
    resolveAt: resolveAt as (tuple: Record<string, string>) => Record<string, DetailToken>,
  };
}
