import { expect, it } from 'vitest';
import { dataAttr } from '#/data-attr.ts';

it('returns the bare `data-<key>` form when prefix is empty', () => {
  expect(dataAttr('', 'mode')).toBe('data-mode');
  expect(dataAttr('', 'theme')).toBe('data-theme');
});

it('prefixes the key as `data-<prefix>-<key>` when prefix is set', () => {
  expect(dataAttr('sb', 'mode')).toBe('data-sb-mode');
  expect(dataAttr('ds', 'theme')).toBe('data-ds-theme');
});

it('handles multi-segment prefixes verbatim — caller responsibility to sanitize', () => {
  // The helper doesn't validate; this is a contract-of-trust test that
  // documents the current behavior so we notice if it changes.
  expect(dataAttr('my.scope', 'mode')).toBe('data-my.scope-mode');
});

it('handles empty key when prefix is set (caller responsibility, but contract-stable)', () => {
  expect(dataAttr('sb', '')).toBe('data-sb-');
});
