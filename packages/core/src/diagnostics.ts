import { Logger, type LogEntry, type LogSeverity } from '@terrazzo/parser';
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
    if (entry.filename) diagnostic.filename = entry.filename.pathname;
    const loc = entry.node?.loc?.start;
    if (loc) {
      diagnostic.line = loc.line;
      diagnostic.column = loc.column;
    }
    return diagnostic;
  });
}

function normalizeSeverity(severity: LogSeverity): DiagnosticSeverity {
  return severity === 'debug' ? 'info' : severity;
}
