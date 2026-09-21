import { Logger } from '@terrazzo/parser';
import type { LogEntry, LogSeverity } from '@terrazzo/parser';
import type { Diagnostic, DiagnosticSeverity } from '#/types.ts';

interface BufferedEntry {
  severity: LogSeverity;
  entry: LogEntry;
}

/**
 * Terrazzo `Logger` subclass that captures log entries into an in-memory
 * buffer instead of writing to stdout. We attach one per `loadProject` call
 * and drain it into `Project.diagnostics` once loading settles.
 *
 * Subclassing is a pragmatic exception to the "functional style" rule —
 * Terrazzo's parser/resolver APIs take a `Logger` instance, so this is the
 * cleanest way to intercept their output.
 */
export class BufferedLogger extends Logger {
  readonly entries: BufferedEntry[] = [];

  override error(...entries: LogEntry[]): void {
    for (const entry of entries) this.entries.push({ severity: 'error', entry });
  }

  override warn(...entries: LogEntry[]): void {
    for (const entry of entries) this.entries.push({ severity: 'warn', entry });
  }

  override info(...entries: LogEntry[]): void {
    for (const entry of entries) this.entries.push({ severity: 'info', entry });
  }
}

/** Map a buffered log entry into swatchbook's public `Diagnostic` shape. */
export function toDiagnostics(logger: BufferedLogger): Diagnostic[] {
  return logger.entries.map(({ severity, entry }) => {
    const diagnostic: Diagnostic = {
      severity: normalizeSeverity(severity),
      group: entry.group,
      message: entry.message,
    };
    if (entry.label) diagnostic.label = entry.label;
    if (entry.filename) diagnostic.filename = entry.filename.pathname;
    const loc = entry.node?.loc?.start;
    if (loc) {
      diagnostic.line = loc.line;
    }
    return diagnostic;
  });
}

/**
 * Collapse diagnostics identical in every field, preserving first-seen order.
 *
 * Multi-tuple loads parse once per singleton tuple against one shared logger,
 * so a single malformed token is reported once per tuple and the count scales
 * with axis cardinality. Diagnostics that differ in source location stay
 * distinct: `filename` and `line` are part of the key.
 */
export function dedupeDiagnostics(diagnostics: readonly Diagnostic[]): Diagnostic[] {
  const seen = new Set<string>();
  const unique: Diagnostic[] = [];
  for (const diagnostic of diagnostics) {
    const key = JSON.stringify([
      diagnostic.severity,
      diagnostic.group,
      diagnostic.label,
      diagnostic.message,
      diagnostic.filename,
      diagnostic.line,
    ]);
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(diagnostic);
  }
  return unique;
}

function normalizeSeverity(severity: LogSeverity): DiagnosticSeverity {
  return severity === 'debug' ? 'info' : severity;
}
