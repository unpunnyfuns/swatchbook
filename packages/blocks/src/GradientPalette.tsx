import type { CSSProperties, ReactElement } from 'react';
import { useMemo } from 'react';
import {
  BORDER_DEFAULT,
  BORDER_FAINT,
  captionStyle,
  emptyStyle,
  MONO_STACK,
  surfaceStyle,
} from '#/internal/styles.ts';
import { themeAttrs } from '#/internal/data-attr.ts';
import { globMatch, makeCssVar, useProject } from '#/internal/use-project.ts';

export interface GradientPaletteProps {
  /**
   * Token-path filter. Defaults to every `gradient` token. Use e.g.
   * `"gradient.ref.*"` or `"gradient.sys.accent"` to scope.
   */
  filter?: string;
  /** Override the caption. */
  caption?: string;
}

const styles = {
  wrapper: surfaceStyle,
  caption: captionStyle,
  empty: emptyStyle,
  row: {
    display: 'grid',
    gridTemplateColumns: 'minmax(180px, 240px) 1fr minmax(140px, 220px)',
    gap: 16,
    alignItems: 'center',
    padding: '16px 0',
    borderBottom: BORDER_DEFAULT,
  } satisfies CSSProperties,
  meta: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    minWidth: 0,
  } satisfies CSSProperties,
  path: {
    fontFamily: MONO_STACK,
    fontSize: 12,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  } satisfies CSSProperties,
  cssVar: {
    fontFamily: MONO_STACK,
    fontSize: 11,
    opacity: 0.7,
  } satisfies CSSProperties,
  sample: {
    height: 56,
    borderRadius: 6,
    border: BORDER_FAINT,
  } satisfies CSSProperties,
  stops: {
    fontFamily: MONO_STACK,
    fontSize: 11,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  } satisfies CSSProperties,
  stopRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  } satisfies CSSProperties,
  stopSwatch: {
    width: 10,
    height: 10,
    borderRadius: 2,
    border: '1px solid var(--sb-color-sys-border-default, rgba(0,0,0,0.1))',
    flex: '0 0 auto',
  } satisfies CSSProperties,
  stopPosition: {
    opacity: 0.6,
  } satisfies CSSProperties,
};

interface GradientStop {
  color?: {
    colorSpace?: string;
    components?: readonly number[];
    alpha?: number;
  };
  position?: number;
}

interface Row {
  path: string;
  cssVar: string;
  stops: GradientStop[];
}

function asStops(raw: unknown): GradientStop[] {
  if (!Array.isArray(raw)) return [];
  return raw as GradientStop[];
}

const pct = (n: number): string => `${(n * 100).toFixed(3)}%`;

function stopCssColor(stop: GradientStop): string {
  const color = stop.color;
  if (!color || !Array.isArray(color.components) || color.components.length < 3) {
    return 'transparent';
  }
  const [r, g, b] = color.components;
  if (r === undefined || g === undefined || b === undefined) return 'transparent';
  const alpha = color.alpha ?? 1;
  return alpha === 1
    ? `rgb(${pct(r)} ${pct(g)} ${pct(b)})`
    : `rgb(${pct(r)} ${pct(g)} ${pct(b)} / ${alpha})`;
}

function stopKey(path: string, stop: GradientStop, fallback: number): string {
  return `${path}|${stop.position ?? fallback}|${stopCssColor(stop)}`;
}

export function GradientPalette({
  filter = 'gradient',
  caption,
}: GradientPaletteProps): ReactElement {
  const { resolved, activeTheme, cssVarPrefix } = useProject();

  const rows = useMemo(() => {
    const collected: Row[] = [];
    for (const [path, token] of Object.entries(resolved)) {
      if (token.$type !== 'gradient') continue;
      if (!globMatch(path, filter)) continue;
      collected.push({
        path,
        cssVar: makeCssVar(path, cssVarPrefix),
        stops: asStops(token.$value),
      });
    }
    collected.sort((a, b) => a.path.localeCompare(b.path, undefined, { numeric: true }));
    return collected;
  }, [resolved, filter, cssVarPrefix]);

  const captionText =
    caption ??
    `${rows.length} gradient${rows.length === 1 ? '' : 's'}${filter ? ` matching \`${filter}\`` : ''} · ${activeTheme}`;

  if (rows.length === 0) {
    return (
      <div {...themeAttrs(cssVarPrefix, activeTheme)} style={styles.wrapper}>
        <div style={styles.empty}>No gradient tokens match this filter.</div>
      </div>
    );
  }

  return (
    <div {...themeAttrs(cssVarPrefix, activeTheme)} style={styles.wrapper}>
      <div style={styles.caption}>{captionText}</div>
      {rows.map((row) => (
        <div key={row.path} style={styles.row}>
          <div style={styles.meta}>
            <span style={styles.path}>{row.path}</span>
            <span style={styles.cssVar}>{row.cssVar}</span>
          </div>
          <div
            style={{ ...styles.sample, background: `linear-gradient(to right, ${row.cssVar})` }}
            aria-hidden
          />
          <div style={styles.stops}>
            {row.stops.map((stop, i) => (
              <div key={stopKey(row.path, stop, i)} style={styles.stopRow}>
                <span
                  style={{ ...styles.stopSwatch, background: stopCssColor(stop) }}
                  aria-hidden
                />
                <span>{stopCssColor(stop)}</span>
                <span style={styles.stopPosition}>
                  @ {((stop.position ?? 0) * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
