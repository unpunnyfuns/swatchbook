import type { CSSProperties, ReactElement } from 'react';
import { useMemo } from 'react';
import { formatValue, makeCssVar, useProject } from '#/internal/use-project.ts';

export interface TokenDetailProps {
  /** Full dot-path of the token to inspect. */
  path: string;
  /** Override the heading. Defaults to the path. */
  heading?: string;
}

interface DetailToken {
  $type?: string;
  $value?: unknown;
  $description?: string;
  aliasOf?: string;
  aliasChain?: string[];
}

const styles = {
  wrapper: {
    fontFamily: 'var(--sb-typography-sys-body-font-family, system-ui)',
    fontSize: 'var(--sb-typography-sys-body-font-size, 14px)',
    color: 'var(--sb-color-sys-text-default, CanvasText)',
    background: 'var(--sb-color-sys-surface-default, Canvas)',
    padding: 16,
    borderRadius: 6,
    border: '1px solid var(--sb-color-sys-border-default, rgba(128,128,128,0.2))',
  } satisfies CSSProperties,
  heading: {
    margin: 0,
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    fontSize: 16,
  } satisfies CSSProperties,
  subline: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    margin: '4px 0 12px',
    fontSize: 12,
    opacity: 0.8,
  } satisfies CSSProperties,
  typePill: {
    display: 'inline-block',
    padding: '2px 6px',
    borderRadius: 4,
    fontSize: 10,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    background: 'var(--sb-color-sys-surface-muted, rgba(128,128,128,0.15))',
  } satisfies CSSProperties,
  description: {
    margin: '0 0 12px',
    opacity: 0.85,
  } satisfies CSSProperties,
  sectionHeader: {
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    opacity: 0.6,
    margin: '12px 0 6px',
  } satisfies CSSProperties,
  chain: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    fontSize: 12,
  } satisfies CSSProperties,
  chainNode: {
    padding: '2px 6px',
    borderRadius: 4,
    border: '1px solid var(--sb-color-sys-border-default, rgba(128,128,128,0.2))',
  } satisfies CSSProperties,
  arrow: {
    opacity: 0.5,
  } satisfies CSSProperties,
  themeTable: {
    width: '100%',
    borderCollapse: 'collapse',
    tableLayout: 'fixed',
    fontSize: 12,
  } satisfies CSSProperties,
  themeRow: {
    borderBottom: '1px solid var(--sb-color-sys-border-default, rgba(128,128,128,0.15))',
  } satisfies CSSProperties,
  themeCell: {
    padding: '6px 8px',
    verticalAlign: 'middle',
  } satisfies CSSProperties,
  swatch: {
    display: 'inline-block',
    width: 14,
    height: 14,
    verticalAlign: 'middle',
    marginRight: 6,
    borderRadius: 3,
    border: '1px solid var(--sb-color-sys-border-default, rgba(0,0,0,0.1))',
  } satisfies CSSProperties,
  snippet: {
    display: 'block',
    padding: '8px 10px',
    borderRadius: 4,
    background: 'var(--sb-color-sys-surface-muted, rgba(128,128,128,0.1))',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    fontSize: 12,
    whiteSpace: 'pre',
    overflow: 'auto',
  } satisfies CSSProperties,
  missing: {
    padding: 12,
    opacity: 0.7,
  } satisfies CSSProperties,
};

export function TokenDetail({ path, heading }: TokenDetailProps): ReactElement {
  const { activeTheme, themesResolved, resolved, cssVarPrefix } = useProject();

  const token = resolved[path] as DetailToken | undefined;
  const cssVar = makeCssVar(path, cssVarPrefix);

  const chain = useMemo<string[]>(() => {
    if (!token) return [];
    if (Array.isArray(token.aliasChain) && token.aliasChain.length > 0) {
      return [path, ...token.aliasChain];
    }
    if (typeof token.aliasOf === 'string') return [path, token.aliasOf];
    return [path];
  }, [token, path]);

  if (!token) {
    return (
      <div data-theme={activeTheme} style={styles.wrapper}>
        <div style={styles.missing}>
          Token <code>{path}</code> not found in theme <strong>{activeTheme}</strong>.
        </div>
      </div>
    );
  }

  const isColor = token.$type === 'color';
  const value = formatValue(token.$value);

  return (
    <div data-theme={activeTheme} style={styles.wrapper}>
      <h3 style={styles.heading}>{heading ?? path}</h3>
      <div style={styles.subline}>
        {token.$type && <span style={styles.typePill}>{token.$type}</span>}
        <span>{cssVar}</span>
      </div>
      {token.$description && <p style={styles.description}>{token.$description}</p>}

      <div style={styles.sectionHeader}>Resolved value · {activeTheme}</div>
      <div style={styles.chain}>
        {isColor && <span style={{ ...styles.swatch, background: cssVar }} aria-hidden />}
        <span>{value}</span>
      </div>

      {chain.length > 1 && (
        <>
          <div style={styles.sectionHeader}>Alias chain</div>
          <div style={styles.chain}>
            {chain.map((step, i) => (
              <span key={step} style={styles.chain}>
                <span style={styles.chainNode}>{step}</span>
                {i < chain.length - 1 && <span style={styles.arrow}>→</span>}
              </span>
            ))}
          </div>
        </>
      )}

      <div style={styles.sectionHeader}>Per-theme values</div>
      <table style={styles.themeTable}>
        <tbody>
          {Object.entries(themesResolved).map(([themeName, tokens]) => {
            const t = tokens[path] as DetailToken | undefined;
            const themeValue = t ? formatValue(t.$value) : '—';
            return (
              <tr key={themeName} style={styles.themeRow}>
                <td style={{ ...styles.themeCell, width: '30%' }}>{themeName}</td>
                <td style={styles.themeCell}>
                  {isColor && t && (
                    <span
                      style={{
                        ...styles.swatch,
                        background: cssVar,
                      }}
                      data-theme={themeName}
                      aria-hidden
                    />
                  )}
                  {themeValue}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div style={styles.sectionHeader}>Usage</div>
      <code style={styles.snippet}>{`color: ${cssVar};`}</code>
    </div>
  );
}
