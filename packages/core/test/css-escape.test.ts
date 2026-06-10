import { expect, it } from 'vitest';
import { cssEscape } from '#/css-escape.ts';

it('leaves a plain string untouched', () => {
  expect(cssEscape('Dark')).toBe('Dark');
  expect(cssEscape('')).toBe('');
});

it('escapes a double-quote so it can sit inside a quoted selector value', () => {
  expect(cssEscape('a"b')).toBe('a\\"b');
});

it('escapes a backslash', () => {
  expect(cssEscape('a\\b')).toBe('a\\\\b');
});

it('escapes the backslash before the quote so an existing \\" is not mangled', () => {
  // Order is load-bearing: backslash first, then quote. Otherwise the
  // quote-escape's own backslash would be doubled by the backslash pass.
  expect(cssEscape('\\"')).toBe('\\\\\\"');
});
