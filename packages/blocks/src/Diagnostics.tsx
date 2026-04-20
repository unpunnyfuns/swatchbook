import type { ReactElement } from 'react';
import './Diagnostics.css';
import { chromeAliases, themeAttrs } from '#/internal/data-attr.ts';
import { useProject } from '#/internal/use-project.ts';
import type { VirtualDiagnostic } from '#/types.ts';

export interface DiagnosticsProps {
  /** Override the section caption. Defaults to a severity summary. */
  caption?: string;
}

type DiagnosticSeverity = VirtualDiagnostic['severity'];

const severityLabel: Record<DiagnosticSeverity, string> = {
  error: 'ERROR',
  warn: 'WARN',
  info: 'INFO',
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

function summaryClass(diagnostics: readonly VirtualDiagnostic[]): string {
  if (diagnostics.length === 0) return 'sb-diagnostics__summary sb-diagnostics__summary--ok';
  if (diagnostics.some((d) => d.severity === 'error')) {
    return 'sb-diagnostics__summary sb-diagnostics__summary--error';
  }
  if (diagnostics.some((d) => d.severity === 'warn')) {
    return 'sb-diagnostics__summary sb-diagnostics__summary--warn';
  }
  return 'sb-diagnostics__summary';
}

function labelClass(severity: DiagnosticSeverity): string {
  return severity === 'info'
    ? 'sb-diagnostics__label'
    : `sb-diagnostics__label sb-diagnostics__label--${severity}`;
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
      style={chromeAliases(cssVarPrefix)}
      data-testid="diagnostics"
    >
      <details open={hasErrorsOrWarnings}>
        <summary className={summaryClass(diagnostics)}>{headingText}</summary>
        {diagnostics.length > 0 && (
          <ul className="sb-diagnostics__list">
            {diagnostics.map((d, i) => (
              <li key={diagnosticKey(d, i)} className="sb-diagnostics__row">
                <span className={labelClass(d.severity)}>{severityLabel[d.severity]}</span>
                <div>
                  <div>{d.message}</div>
                  {(d.group || d.filename) && (
                    <div className="sb-diagnostics__meta">
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
