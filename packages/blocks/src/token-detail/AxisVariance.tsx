import type { ReactElement } from 'react';
import { useMemo } from 'react';
import { formatValue } from '#/internal/use-project.ts';
import { styles } from '#/token-detail/styles.ts';
import {
  type DetailToken,
  type VirtualAxisLike,
  type VirtualThemeLike,
  useTokenDetailData,
} from '#/token-detail/internal.ts';

export interface AxisVarianceProps {
  /** Full dot-path of the token. */
  path: string;
}

interface Variance {
  kind: 'constant' | 'one-axis' | 'multi-axis';
  varyingAxes: readonly string[];
}

export function AxisVariance({ path }: AxisVarianceProps): ReactElement {
  const { token, cssVar, axes, themes, themesResolved, activeAxes } = useTokenDetailData(path);
  const isColor = token?.$type === 'color';

  const variance = useMemo(
    () => analyzeVariance(path, axes, themes, themesResolved),
    [path, axes, themes, themesResolved],
  );

  if (themes.length === 0) {
    return <></>;
  }

  if (variance.kind === 'constant') {
    const anyTheme = themes[0];
    const value = anyTheme ? themeValue(themesResolved, anyTheme.name, path) : '—';
    return (
      <>
        <div style={styles.sectionHeader}>Values across axes</div>
        <table style={styles.themeTable} data-testid='token-detail-values'>
          <tbody>
            <tr style={styles.themeRow}>
              <td style={styles.themeCell} data-testid='token-detail-constant'>
                {isColor && <span style={{ ...styles.swatch, background: cssVar }} aria-hidden />}
                {value}
                <span style={{ opacity: 0.6, marginLeft: 8 }}>
                  same across all {themes.length} tuples
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
      const match = themes.find((t) => {
        const input = t.input;
        return Object.keys(input).every((k) => input[k] === target[k]);
      });
      const name = match?.name ?? '';
      return {
        ctx,
        themeName: name,
        value: name ? themeValue(themesResolved, name, path) : '—',
      };
    });
    return (
      <>
        <div style={styles.sectionHeader}>Varies with {axisName}</div>
        <table style={styles.themeTable} data-testid='token-detail-values'>
          <tbody>
            {contextValues.map((row) => (
              <tr key={row.ctx} style={styles.themeRow} data-axis={axisName} data-context={row.ctx}>
                <td style={{ ...styles.themeCell, width: '30%' }}>{row.ctx}</td>
                <td style={styles.themeCell}>
                  {isColor && row.themeName && (
                    <span
                      style={{ ...styles.swatch, background: cssVar }}
                      data-theme={row.themeName}
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
    .filter((a): a is VirtualAxisLike => Boolean(a))
    .toSorted((a, b) => b.contexts.length - a.contexts.length);
  const [rowAxis, colAxis, ...extra] = varying;
  if (!rowAxis || !colAxis) return <></>;

  return (
    <>
      <div style={styles.sectionHeader}>Varies with {variance.varyingAxes.join(' × ')}</div>
      <table style={styles.themeTable} data-testid='token-detail-values'>
        <thead>
          <tr style={styles.themeRow}>
            <th style={{ ...styles.themeCell, textAlign: 'left', opacity: 0.7 }}>
              {rowAxis.name} \ {colAxis.name}
            </th>
            {colAxis.contexts.map((col) => (
              <th key={col} style={{ ...styles.themeCell, textAlign: 'left', opacity: 0.7 }}>
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rowAxis.contexts.map((row) => (
            <tr key={row} style={styles.themeRow}>
              <td style={styles.themeCell}>{row}</td>
              {colAxis.contexts.map((col) => {
                const target: Record<string, string> = {
                  ...activeAxes,
                  [rowAxis.name]: row,
                  [colAxis.name]: col,
                };
                const name = tupleName(themes, target);
                const value = name ? themeValue(themesResolved, name, path) : '—';
                return (
                  <td key={col} style={styles.themeCell} data-row={row} data-col={col}>
                    {isColor && name && (
                      <span
                        style={{ ...styles.swatch, background: cssVar }}
                        data-theme={name}
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
        <div style={{ ...styles.aliasedByTruncated, marginTop: 6 }}>
          Values also vary with {extra.map((a) => a.name).join(', ')}; matrix shows the slice for
          the active selection.
        </div>
      )}
    </>
  );
}

function themeValue(
  themesResolved: Record<string, Record<string, DetailToken>>,
  themeName: string,
  path: string,
): string {
  const t = themesResolved[themeName]?.[path];
  return t ? formatValue(t.$value) : '—';
}

function tupleName(
  themes: readonly VirtualThemeLike[],
  tuple: Record<string, string>,
): string | undefined {
  const match = themes.find((t) => {
    const input = t.input;
    const keys = Object.keys(input);
    return keys.every((k) => input[k] === tuple[k]);
  });
  return match?.name;
}

function analyzeVariance(
  path: string,
  axes: readonly VirtualAxisLike[],
  themes: readonly VirtualThemeLike[],
  themesResolved: Record<string, Record<string, DetailToken>>,
): Variance {
  const varyingAxes: string[] = [];
  for (const axis of axes) {
    const byOthers = new Map<string, Map<string, string>>();
    for (const theme of themes) {
      const others = axes
        .filter((a) => a.name !== axis.name)
        .map((a) => `${a.name}=${theme.input[a.name] ?? ''}`)
        .join('|');
      const ctx = theme.input[axis.name] ?? '';
      const bucket = byOthers.get(others) ?? new Map<string, string>();
      bucket.set(ctx, themeValue(themesResolved, theme.name, path));
      byOthers.set(others, bucket);
    }
    let varies = false;
    for (const bucket of byOthers.values()) {
      const values = new Set(bucket.values());
      if (values.size > 1) {
        varies = true;
        break;
      }
    }
    if (varies) varyingAxes.push(axis.name);
  }
  if (varyingAxes.length === 0) return { kind: 'constant', varyingAxes };
  if (varyingAxes.length === 1) return { kind: 'one-axis', varyingAxes };
  return { kind: 'multi-axis', varyingAxes };
}
