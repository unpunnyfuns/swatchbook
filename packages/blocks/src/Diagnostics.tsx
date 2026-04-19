import type { CSSProperties, ReactElement } from 'react';
import { chromeAliases, themeAttrs } from '#/internal/data-attr.ts';
import { surfaceStyle } from '#/internal/styles.ts';
import { useProject } from '#/internal/use-project.ts';
import type { VirtualDiagnostic } from '#/types.ts';

export interface DiagnosticsProps {
  /** Override the section caption. Defaults to a severity summary. */
  caption?: string;
}

type DiagnosticSeverity = VirtualDiagnostic['severity'];

const severityColor: Record<DiagnosticSeverity, string> = {
  error: '#d64545',
  warn: '#b08900',
  info: 'inherit',
};

const severityLabel: Record<DiagnosticSeverity, string> = {
  error: 'ERROR',
  warn: 'WARN',
  info: 'INFO',
};

const styles = {
  wrapper: surfaceStyle,
  summary: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '4px 0',
    fontSize: 13,
    cursor: 'pointer',
    listStyle: 'none',
    fontWeight: 600,
  } satisfies CSSProperties,
  list: {
    listStyle: 'none',
    margin: '8px 0 0',
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
  } satisfies CSSProperties,
  row: {
    display: 'grid',
    gridTemplateColumns: '60px 1fr',
    gap: 12,
    padding: '8px 4px',
    borderTop: '1px solid var(--sb-color-sys-border-default, rgba(128,128,128,0.12))',
    fontSize: 12,
  } satisfies CSSProperties,
  label: {
    fontWeight: 600,
    fontSize: 10,
    letterSpacing: 0.5,
  } satisfies CSSProperties,
  meta: {
    color: 'var(--sb-color-sys-text-muted, CanvasText)',
    fontSize: 11,
    marginTop: 4,
    opacity: 0.7,
  } satisfies CSSProperties,
};

function summaryText(diagnostics: readonly VirtualDiagnostic[]): string {
  if (diagnostics.length === 0) return '✔ OK · no diagnostics';
  const counts = { error: 0, warn: 0, info: 0 };
  for (const d of diagnostics) counts[d.severity] += 1;
  const parts: string[] = [];
  if (counts.error > 0) parts.push(`✖ ${counts.error} error${counts.error === 1 ? '' : 's'}`);
  if (counts.warn > 0) parts.push(`⚠ ${counts.warn} warning${counts.warn === 1 ? '' : 's'}`);
  if (counts.info > 0) parts.push(`${counts.info} info`);
  return parts.join(' · ');
}

function diagnosticKey(d: VirtualDiagnostic, i: number): string {
  return `${d.severity}:${d.group}:${d.filename ?? ''}:${d.line ?? ''}:${d.message}:${i}`;
}

function summaryColor(diagnostics: readonly VirtualDiagnostic[]): string {
  if (diagnostics.length === 0) return '#30a46c';
  if (diagnostics.some((d) => d.severity === 'error')) return severityColor.error;
  if (diagnostics.some((d) => d.severity === 'warn')) return severityColor.warn;
  return 'inherit';
}

/**
 * Render the project's load diagnostics — parser errors, resolver warnings,
 * disabled-axes validation issues, etc. — as a collapsible list. Auto-opens
 * when the project carries errors or warnings; stays collapsed for clean
 * loads and info-only loads.
 *
 * Replaces the diagnostics section from the addon's (now-retired) Design
 * Tokens panel. Consumers compose it alongside TokenNavigator / TokenTable
 * on their own MDX pages.
 */
export function Diagnostics({ caption }: DiagnosticsProps = {}): ReactElement {
  const { activeTheme, cssVarPrefix, diagnostics } = useProject();

  const hasErrorsOrWarnings = diagnostics.some(
    (d) => d.severity === 'error' || d.severity === 'warn',
  );
  const headingText = caption ?? `Diagnostics · ${summaryText(diagnostics)}`;

  return (
    <div
      {...themeAttrs(cssVarPrefix, activeTheme)}
      style={{ ...chromeAliases(cssVarPrefix), ...styles.wrapper }}
      data-testid='diagnostics'
    >
      <details open={hasErrorsOrWarnings}>
        <summary style={{ ...styles.summary, color: summaryColor(diagnostics) }}>
          {headingText}
        </summary>
        {diagnostics.length > 0 && (
          <ul style={styles.list}>
            {diagnostics.map((d, i) => (
              <li key={diagnosticKey(d, i)} style={styles.row}>
                <span style={{ ...styles.label, color: severityColor[d.severity] }}>
                  {severityLabel[d.severity]}
                </span>
                <div>
                  <div>{d.message}</div>
                  {(d.group || d.filename) && (
                    <div style={styles.meta}>
                      {[d.group, d.filename, d.line ? `:${d.line}` : '']
                        .filter(Boolean)
                        .join(' · ')}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </details>
    </div>
  );
}
