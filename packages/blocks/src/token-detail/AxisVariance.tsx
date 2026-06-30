import type { Axis } from '@unpunnyfuns/swatchbook-core';
import type { ReactElement } from 'react';
import { useMemo } from 'react';
import { useColorFormat } from '#/contexts.ts';
import type { ColorFormat } from '#/format-color.ts';
import { perAxisAttrs } from '#/internal/data-attr.ts';
import { formatTokenValue } from '#/internal/format-token-value.ts';
import { useTokenDetailData } from '#/token-detail/internal.ts';
import type { DetailToken } from '#/token-detail/internal.ts';

export interface AxisVarianceProps {
  /** Full dot-path of the token. */
  path: string;
}

type Variance =
  | { kind: 'constant' }
  | { kind: 'one-axis'; axis: string; varyingAxes: readonly [string] }
  | { kind: 'multi-axis'; varyingAxes: readonly [string, string, ...string[]] };

export function AxisVariance({ path }: AxisVarianceProps): ReactElement {
  const { token, cssVar, axes, activeAxes, cssVarPrefix, varianceByPath, resolveAt } =
    useTokenDetailData(path);
  const colorFormat = useColorFormat();
  const tokenType = token?.$type;
  const isColor = tokenType === 'color';
  const formatFn = (t: DetailToken | undefined): string => valueFor(t, tokenType, colorFormat);

  const variance = useMemo<Variance>(() => {
    // Read the pre-computed per-path variance from the snapshot. The
    // server side runs the bucket analysis once at load and ships the
    // map over the wire — O(1) lookup per render instead of an O(paths
    // × permutations) re-derivation here.
    const result = varianceByPath[path];
    if (!result) return { kind: 'constant' };
    switch (result.kind) {
      case 'constant':
        return { kind: 'constant' };
      case 'single':
        return { kind: 'one-axis', axis: result.axis, varyingAxes: result.varyingAxes };
      case 'multi':
        return { kind: 'multi-axis', varyingAxes: result.varyingAxes };
      default: {
        const exhaustive: never = result;
        throw new Error(`unhandled AxisVarianceResult kind: ${JSON.stringify(exhaustive)}`);
      }
    }
  }, [path, varianceByPath]);

  if (axes.length === 0) {
    return <></>;
  }

  if (variance.kind === 'constant') {
    const value = formatFn(resolveAt(activeAxes)[path] as DetailToken | undefined);
    return (
      <>
        <div className="sb-token-detail__section-header">Values across axes</div>
        <table className="sb-token-detail__theme-table" data-testid="token-detail-values">
          <tbody>
            <tr className="sb-token-detail__theme-row">
              <td className="sb-token-detail__theme-cell" data-testid="token-detail-constant">
                {isColor && (
                  <span
                    className="sb-token-detail__swatch"
                    style={{ background: cssVar }}
                    aria-hidden
                  />
                )}
                {value}
                <span className="sb-token-detail__constant-label-note">same across every axis</span>
              </td>
            </tr>
          </tbody>
        </table>
      </>
    );
  }

  if (variance.kind === 'one-axis') {
    const axisName = variance.axis;
    const axis = axes.find((a) => a.name === axisName);
    if (!axis) return <></>;
    const contextValues = axis.contexts.map((ctx) => {
      const target = { ...activeAxes, [axisName]: ctx };
      return {
        ctx,
        target,
        value: formatFn(resolveAt(target)[path] as DetailToken | undefined),
      };
    });
    return (
      <>
        <div className="sb-token-detail__section-header">Varies with {axisName}</div>
        <table className="sb-token-detail__theme-table" data-testid="token-detail-values">
          <tbody>
            {contextValues.map((row) => (
              <tr
                key={row.ctx}
                className="sb-token-detail__theme-row"
                data-axis={axisName}
                data-context={row.ctx}
              >
                <td className="sb-token-detail__theme-cell sb-token-detail__theme-cell--label">
                  {row.ctx}
                </td>
                <td className="sb-token-detail__theme-cell">
                  {isColor && (
                    <span
                      className="sb-token-detail__swatch"
                      style={{ background: cssVar }}
                      {...perAxisAttrs(cssVarPrefix, row.target)}
                      aria-hidden
                    />
                  )}
                  {row.value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </>
    );
  }

  const varying = variance.varyingAxes
    .map((name) => axes.find((a) => a.name === name))
    .filter((a): a is Axis => Boolean(a))
    .toSorted((a, b) => b.contexts.length - a.contexts.length);
  const [rowAxis, colAxis, ...extra] = varying;
  if (!rowAxis || !colAxis) return <></>;

  return (
    <>
      <div className="sb-token-detail__section-header">
        Varies with {variance.varyingAxes.join(' × ')}
      </div>
      <table className="sb-token-detail__theme-table" data-testid="token-detail-values">
        <thead>
          <tr className="sb-token-detail__theme-row">
            <th className="sb-token-detail__theme-cell sb-token-detail__theme-cell--header">
              {rowAxis.name} \ {colAxis.name}
            </th>
            {colAxis.contexts.map((col) => (
              <th
                key={col}
                className="sb-token-detail__theme-cell sb-token-detail__theme-cell--header"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rowAxis.contexts.map((row) => (
            <tr key={row} className="sb-token-detail__theme-row">
              <td className="sb-token-detail__theme-cell">{row}</td>
              {colAxis.contexts.map((col) => {
                const target: Record<string, string> = {
                  ...activeAxes,
                  [rowAxis.name]: row,
                  [colAxis.name]: col,
                };
                const value = formatFn(resolveAt(target)[path] as DetailToken | undefined);
                return (
                  <td
                    key={col}
                    className="sb-token-detail__theme-cell"
                    data-row={row}
                    data-col={col}
                  >
                    {isColor && (
                      <span
                        className="sb-token-detail__swatch"
                        style={{ background: cssVar }}
                        {...perAxisAttrs(cssVarPrefix, target)}
                        aria-hidden
                      />
                    )}
                    {value}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {extra.length > 0 && (
        <div className="sb-token-detail__aliased-by-truncated sb-token-detail__aliased-by-truncated--axis-note">
          Values also vary with {extra.map((a) => a.name).join(', ')}; matrix shows the slice for
          the active selection.
        </div>
      )}
    </>
  );
}

function valueFor(
  token: DetailToken | undefined,
  $type: string | undefined,
  format: ColorFormat,
): string {
  if (!token) return '—';
  return formatTokenValue(token.$value, $type, format);
}
