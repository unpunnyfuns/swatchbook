/**
 * `toDiagnostics(logger)` projects a `BufferedLogger`'s captured
 * entries onto the public `Diagnostic[]` shape that lands on
 * `Project.diagnostics`. Strips Terrazzo-specific node shapes; folds
 * `debug` into `info`; pulls file/line/column out of the node loc.
 *
 * The upstream `BufferedLogger` collection itself lives in
 * `diagnostics-buffered-logger.test.ts`.
 */
import { expect, it } from 'vitest';
import type { LogEntry } from '@terrazzo/parser';
import { BufferedLogger, toDiagnostics } from '#/diagnostics.ts';

function entry(partial: Partial<LogEntry> & { group: string; message: string }): LogEntry {
  return { ...partial } as LogEntry;
}

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
