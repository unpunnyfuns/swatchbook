import { expect, it } from 'vitest';
import { summarize } from '#/Diagnostics.tsx';

it('reports OK for no diagnostics', () => {
  const s = summarize([]);
  expect(s.text).toBe('✔ OK · no diagnostics');
  expect(s.variant).toBe('ok');
  expect(s.hasErrorsOrWarnings).toBe(false);
});

it('aggregates counts and flags errors/warnings', () => {
  const s = summarize([
    { severity: 'error', group: 'parser', message: 'a' },
    { severity: 'warn', group: 'parser', message: 'b' },
    { severity: 'info', group: 'parser', message: 'c' },
  ]);
  expect(s.text).toBe('✖ 1 error · ⚠ 1 warning · 1 info');
  expect(s.variant).toBe('error');
  expect(s.hasErrorsOrWarnings).toBe(true);
});

it('picks the warn variant when there are warnings but no errors', () => {
  const s = summarize([{ severity: 'warn', group: 'parser', message: 'b' }]);
  expect(s.variant).toBe('warn');
});
