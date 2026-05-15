/**
 * Direct unit coverage of `BufferedLogger` + `toDiagnostics` from
 * `src/diagnostics.ts`. Every loader path captures diagnostics via
 * this helper; the integration tests assert on captured diagnostics
 * but don't pin the wire-up. This file does.
 */
import { describe, expect, it } from 'vitest';
import type { LogEntry } from '@terrazzo/parser';
import { BufferedLogger, toDiagnostics } from '#/diagnostics.ts';

function entry(partial: Partial<LogEntry> & { group: string; message: string }): LogEntry {
  return { ...partial } as LogEntry;
}

describe('BufferedLogger', () => {
  it('captures error / warn / info entries with their severity', () => {
    const logger = new BufferedLogger();
    logger.error(entry({ group: 'parser', message: 'bad' }));
    logger.warn(entry({ group: 'resolver', message: 'odd' }));
    logger.info(entry({ group: 'plugin', message: 'note' }));
    expect(logger.entries).toHaveLength(3);
    expect(logger.entries[0]?.severity).toBe('error');
    expect(logger.entries[1]?.severity).toBe('warn');
    expect(logger.entries[2]?.severity).toBe('info');
  });

  it('accepts variadic entries in a single call', () => {
    const logger = new BufferedLogger();
    logger.warn(
      entry({ group: 'g', message: 'one' }),
      entry({ group: 'g', message: 'two' }),
      entry({ group: 'g', message: 'three' }),
    );
    expect(logger.entries.map((e) => e.entry.message)).toEqual(['one', 'two', 'three']);
  });

  it('preserves insertion order across mixed severities', () => {
    const logger = new BufferedLogger();
    logger.info(entry({ group: 'g', message: 'a' }));
    logger.error(entry({ group: 'g', message: 'b' }));
    logger.warn(entry({ group: 'g', message: 'c' }));
    expect(logger.entries.map((e) => e.severity)).toEqual(['info', 'error', 'warn']);
  });
});

describe('toDiagnostics', () => {
  it('maps buffered entries to the public Diagnostic shape', () => {
    const logger = new BufferedLogger();
    logger.error(entry({ group: 'parser/syntax', message: 'unexpected token' }));
    const diagnostics = toDiagnostics(logger);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]).toEqual({
      severity: 'error',
      group: 'parser/syntax',
      message: 'unexpected token',
    });
  });

  it('normalizes `debug` severity to `info` (swatchbook does not surface debug)', () => {
    const logger = new BufferedLogger();
    logger.entries.push({
      severity: 'debug',
      entry: entry({ group: 'g', message: 'noisy' }),
    });
    expect(toDiagnostics(logger)[0]?.severity).toBe('info');
  });

  it('attaches filename (pathname only) when present on the entry', () => {
    const logger = new BufferedLogger();
    logger.warn(
      entry({
        group: 'resolver',
        message: 'modifier with no default',
        filename: new URL('file:///path/to/tokens.json'),
      }),
    );
    expect(toDiagnostics(logger)[0]?.filename).toBe('/path/to/tokens.json');
  });

  it('attaches line / column when the entry carries a node loc', () => {
    const logger = new BufferedLogger();
    logger.warn(
      entry({
        group: 'plugin',
        message: 'odd value',
        node: { loc: { start: { line: 42, column: 7 } } } as LogEntry['node'],
      }),
    );
    const diag = toDiagnostics(logger)[0];
    expect(diag?.line).toBe(42);
    expect(diag?.column).toBe(7);
  });

  it('omits filename / line / column when absent', () => {
    const logger = new BufferedLogger();
    logger.error(entry({ group: 'g', message: 'bare' }));
    const diag = toDiagnostics(logger)[0];
    expect(diag).not.toHaveProperty('filename');
    expect(diag).not.toHaveProperty('line');
    expect(diag).not.toHaveProperty('column');
  });

  it('returns an empty array when the buffer is empty', () => {
    expect(toDiagnostics(new BufferedLogger())).toEqual([]);
  });
});
