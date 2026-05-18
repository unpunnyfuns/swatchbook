import cx from 'clsx';
import type { ReactElement } from 'react';
import { useMemo } from 'react';
import './Diagnostics.css';
import { themeAttrs } from '#/internal/data-attr.ts';
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

interface DiagnosticsSummary {
  text: string;
  variant: 'ok' | 'error' | 'warn' | null;
  hasErrorsOrWarnings: boolean;
}

function summarize(diagnostics: readonly VirtualDiagnostic[]): DiagnosticsSummary {
  if (diagnostics.length === 0) {
    return { text: '✔ OK · no diagnostics', variant: 'ok', hasErrorsOrWarnings: false };
  }
  let errors = 0;
  let warnings = 0;
  let infos = 0;
  for (const d of diagnostics) {
    if (d.severity === 'error') errors += 1;
    else if (d.severity === 'warn') warnings += 1;
    else infos += 1;
  }
  const parts: string[] = [];
  if (errors > 0) parts.push(`✖ ${errors} error${errors === 1 ? '' : 's'}`);
  if (warnings > 0) parts.push(`⚠ ${warnings} warning${warnings === 1 ? '' : 's'}`);
  if (infos > 0) parts.push(`${infos} info`);
  const variant = errors > 0 ? 'error' : warnings > 0 ? 'warn' : null;
  return {
    text: parts.join(' · '),
    variant,
    hasErrorsOrWarnings: errors > 0 || warnings > 0,
  };
}

function diagnosticKey(d: VirtualDiagnostic, i: number): string {
  return `${d.severity}:${d.group}:${d.filename ?? ''}:${d.line ?? ''}:${d.message}:${i}`;
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
  const { activeAxes, cssVarPrefix, diagnostics } = useProject();
  const summary = useMemo(() => summarize(diagnostics), [diagnostics]);
  const headingText = caption ?? `Diagnostics · ${summary.text}`;

  return (
    <div {...themeAttrs(cssVarPrefix, activeAxes)} data-testid="diagnostics">
      <details open={summary.hasErrorsOrWarnings}>
        <summary
          className={cx(
            'sb-diagnostics__summary',
            summary.variant && `sb-diagnostics__summary--${summary.variant}`,
          )}
        >
          {headingText}
        </summary>
        {diagnostics.length > 0 && (
          <ul role="list" className="sb-diagnostics__list">
            {diagnostics.map((d, i) => (
              <li
                key={diagnosticKey(d, i)}
                className="sb-diagnostics__row"
                aria-label={`${severityLabel[d.severity]}: ${d.message}`}
              >
                <span
                  className={cx('sb-diagnostics__label', {
                    [`sb-diagnostics__label--${d.severity}`]: d.severity !== 'info',
                  })}
                  aria-hidden
                >
                  {severityLabel[d.severity]}
                </span>
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
