import type { CSSProperties, ReactElement } from 'react';
import { useMemo } from 'react';
import { globMatch, useProject } from '#/internal/use-project.ts';

export interface TypographyScaleProps {
  /**
   * Token-path filter. Defaults to every `typography` token. Use e.g.
   * `"typography.sys.*"` to scope to the semantic layer.
   */
  filter?: string;
  /** Override the sample text rendered for each token. */
  sample?: string;
  /** Override the caption. */
  caption?: string;
}

const styles = {
  wrapper: {
    fontFamily: 'var(--sb-typography-sys-body-font-family, system-ui)',
    color: 'var(--sb-color-sys-text-default, CanvasText)',
    background: 'var(--sb-color-sys-surface-default, Canvas)',
    padding: 12,
    borderRadius: 6,
  } satisfies CSSProperties,
  caption: {
    padding: '4px 0 12px',
    opacity: 0.7,
    fontSize: 12,
  } satisfies CSSProperties,
  row: {
    display: 'grid',
    gridTemplateColumns: 'minmax(160px, 220px) 1fr',
    gap: 16,
    alignItems: 'baseline',
    padding: '14px 0',
    borderBottom: '1px solid var(--sb-color-sys-border-default, rgba(128,128,128,0.2))',
  } satisfies CSSProperties,
  meta: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  } satisfies CSSProperties,
  path: {
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    fontSize: 12,
  } satisfies CSSProperties,
  specs: {
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    fontSize: 11,
    opacity: 0.7,
  } satisfies CSSProperties,
  empty: {
    padding: '24px 12px',
    textAlign: 'center',
    opacity: 0.6,
  } satisfies CSSProperties,
};

interface Row {
  path: string;
  sampleStyle: CSSProperties;
  specs: string;
}

function asDimension(raw: unknown): string | undefined {
  if (raw == null) return undefined;
  if (typeof raw === 'string' || typeof raw === 'number') return String(raw);
  if (typeof raw === 'object') {
    const v = raw as Record<string, unknown>;
    if ('value' in v && 'unit' in v) return `${String(v['value'])}${String(v['unit'])}`;
  }
  return undefined;
}

function asFontFamily(raw: unknown): string | undefined {
  if (typeof raw === 'string') return raw;
  if (Array.isArray(raw)) return raw.map(String).join(', ');
  return undefined;
}

function buildRow(path: string, composite: Record<string, unknown>): Row {
  const fontFamily = asFontFamily(composite['fontFamily']);
  const fontSize = asDimension(composite['fontSize']);
  const fontWeight = composite['fontWeight'] == null ? undefined : String(composite['fontWeight']);
  const lineHeight = composite['lineHeight'] == null ? undefined : String(composite['lineHeight']);
  const letterSpacing = asDimension(composite['letterSpacing']);

  const sampleStyle: CSSProperties = {};
  if (fontFamily) sampleStyle.fontFamily = fontFamily;
  if (fontSize) sampleStyle.fontSize = fontSize;
  if (fontWeight) sampleStyle.fontWeight = fontWeight as CSSProperties['fontWeight'];
  if (lineHeight) sampleStyle.lineHeight = lineHeight;
  if (letterSpacing) sampleStyle.letterSpacing = letterSpacing;

  const parts = [
    fontSize,
    fontWeight ? `w${fontWeight}` : undefined,
    lineHeight ? `lh ${lineHeight}` : undefined,
  ]
    .filter(Boolean)
    .join(' · ');

  return { path, sampleStyle, specs: parts };
}

export function TypographyScale({
  filter = 'typography',
  sample = 'The quick brown fox jumps over the lazy dog.',
  caption,
}: TypographyScaleProps): ReactElement {
  const { resolved, activeTheme } = useProject();

  const rows = useMemo<Row[]>(() => {
    return Object.entries(resolved)
      .filter(([path, token]) => {
        if (token.$type !== 'typography') return false;
        return globMatch(path, filter);
      })
      .toSorted(([a], [b]) => a.localeCompare(b))
      .map(([path, token]) => {
        const value = token.$value;
        if (!value || typeof value !== 'object') {
          return { path, sampleStyle: {}, specs: '' };
        }
        return buildRow(path, value as Record<string, unknown>);
      });
  }, [resolved, filter]);

  const captionText =
    caption ??
    `${rows.length} typography token${rows.length === 1 ? '' : 's'}${filter && filter !== 'typography' ? ` matching \`${filter}\`` : ''} · ${activeTheme}`;

  if (rows.length === 0) {
    return (
      <div data-theme={activeTheme} style={styles.wrapper}>
        <div style={styles.empty}>No typography tokens match this filter.</div>
      </div>
    );
  }

  return (
    <div data-theme={activeTheme} style={styles.wrapper}>
      <div style={styles.caption}>{captionText}</div>
      {rows.map((row) => (
        <div key={row.path} style={styles.row}>
          <div style={styles.meta}>
            <span style={styles.path}>{row.path}</span>
            {row.specs && <span style={styles.specs}>{row.specs}</span>}
          </div>
          <div style={row.sampleStyle}>{sample}</div>
        </div>
      ))}
    </div>
  );
}
