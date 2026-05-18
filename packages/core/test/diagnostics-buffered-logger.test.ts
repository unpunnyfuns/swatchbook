/**
 * `BufferedLogger` collects severity-tagged log entries from Terrazzo
 * during loader runs. Every loader path captures diagnostics via this
 * helper; the integration tests assert on captured diagnostics but
 * don't pin the wire-up. This file does.
 *
 * The downstream `toDiagnostics(logger)` mapping lives in
 * `diagnostics-to-diagnostics.test.ts`.
 */
import { expect, it } from 'vitest';
import type { LogEntry } from '@terrazzo/parser';
import { BufferedLogger } from '#/diagnostics.ts';

function entry(partial: Partial<LogEntry> & { group: string; message: string }): LogEntry {
  return { ...partial } as LogEntry;
}

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
