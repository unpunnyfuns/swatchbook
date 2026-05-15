import { analyzeAxisVariance } from '@unpunnyfuns/swatchbook-core/variance';
import type { Axis, Permutation, TokenMap } from '@unpunnyfuns/swatchbook-core';
import type { ReactElement } from 'react';
import { useMemo } from 'react';
import { useColorFormat } from '#/contexts.ts';
import type { ColorFormat } from '#/format-color.ts';
import { dataAttr } from '#/internal/data-attr.ts';
import { formatTokenValue } from '#/internal/format-token-value.ts';
import { type DetailToken, useTokenDetailData } from '#/token-detail/internal.ts';

export interface AxisVarianceProps {
  /** Full dot-path of the token. */
  path: string;
}

interface Variance {
  kind: 'constant' | 'one-axis' | 'multi-axis';
  varyingAxes: readonly string[];
}

export function AxisVariance({ path }: AxisVarianceProps): ReactElement {
  const { token, cssVar, axes, permutations, permutationsResolved, activeAxes, cssVarPrefix } =
    useTokenDetailData(path);
  const colorFormat = useColorFormat();
  const tokenType = token?.$type;
  const isColor = tokenType === 'color';
  const formatFn = (t: DetailToken | undefined): string => valueFor(t, tokenType, colorFormat);

  const variance = useMemo<Variance>(() => {
    // permutationsResolved is the only field needing a structural narrow —
    // the block's `DetailToken` is a subset of core's `TokenNormalized`,
    // so the wrapping record types differ even though the keys match.
    const result = analyzeAxisVariance(
      path,
      axes,
      permutations,
      permutationsResolved as Record<string, TokenMap>,
    );
    // Map core's terse kind vocabulary to the block's display-ready one.
    const kind =
      result.kind === 'constant'
        ? 'constant'
        : result.kind === 'single'
          ? 'one-axis'
          : 'multi-axis';
    return { kind, varyingAxes: result.varyingAxes };
  }, [path, axes, permutations, permutationsResolved]);

  if (permutations.length === 0) {
    return <></>;
  }

  if (variance.kind === 'constant') {
    const anyPermutation = permutations[0];
    const value = anyPermutation
      ? formatFn(permutationsResolved[anyPermutation.name]?.[path])
      : '—';
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
                <span style={{ opacity: 0.6, marginLeft: 8 }}>
                  same across all {permutations.length} tuples
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </>
    );
  }

  if (variance.kind === 'one-axis') {
    const axisName = variance.varyingAxes[0];
    if (!axisName) return <></>;
    const axis = axes.find((a) => a.name === axisName);
    if (!axis) return <></>;
    const contextValues = axis.contexts.map((ctx) => {
      const target = { ...activeAxes, [axisName]: ctx };
      const match = permutations.find((t) => {
        const input = t.input;
        return Object.keys(input).every((k) => input[k] === target[k]);
      });
      const name = match?.name ?? '';
      return {
        ctx,
        themeName: name,
        value: name ? formatFn(permutationsResolved[name]?.[path]) : '—',
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
                <td className="sb-token-detail__theme-cell" style={{ width: '30%' }}>
                  {row.ctx}
                </td>
                <td className="sb-token-detail__theme-cell">
                  {isColor && row.themeName && (
                    <span
                      className="sb-token-detail__swatch"
                      style={{ background: cssVar }}
                      {...{ [dataAttr(cssVarPrefix, 'theme')]: row.themeName }}
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
            <th className="sb-token-detail__theme-cell" style={{ textAlign: 'left', opacity: 0.7 }}>
              {rowAxis.name} \ {colAxis.name}
            </th>
            {colAxis.contexts.map((col) => (
              <th
                key={col}
                className="sb-token-detail__theme-cell"
                style={{ textAlign: 'left', opacity: 0.7 }}
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
                const name = tupleName(permutations, target);
                const value = name ? formatFn(permutationsResolved[name]?.[path]) : '—';
                return (
                  <td
                    key={col}
                    className="sb-token-detail__theme-cell"
                    data-row={row}
                    data-col={col}
                  >
                    {isColor && name && (
                      <span
                        className="sb-token-detail__swatch"
                        style={{ background: cssVar }}
                        {...{ [dataAttr(cssVarPrefix, 'theme')]: name }}
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
        <div className="sb-token-detail__aliased-by-truncated" style={{ marginTop: 6 }}>
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

function tupleName(
  permutations: readonly Permutation[],
  tuple: Record<string, string>,
): string | undefined {
  const match = permutations.find((t) => {
    const input = t.input;
    const keys = Object.keys(input);
    return keys.every((k) => input[k] === tuple[k]);
  });
  return match?.name;
}
