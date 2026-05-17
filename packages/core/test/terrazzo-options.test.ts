import { expect, it } from 'vitest';
import { validateCssOptions } from '#/terrazzo-options.ts';

it('validateCssOptions returns no diagnostics for an empty object', () => {
  const { diagnostics } = validateCssOptions({});
  expect(diagnostics).toEqual([]);
});

it('validateCssOptions returns no diagnostics when called without options', () => {
  const { diagnostics } = validateCssOptions(undefined);
  expect(diagnostics).toEqual([]);
});

it('validateCssOptions lets supported knobs pass without complaint', () => {
  const { diagnostics } = validateCssOptions({ legacyHex: true, include: ['color.*'] });
  expect(diagnostics).toEqual([]);
});

it('validateCssOptions warns when `baseSelector` is set — superseded by permutations', () => {
  const { diagnostics } = validateCssOptions({ baseSelector: ':host' });
  expect(diagnostics).toHaveLength(1);
  expect(diagnostics[0]?.severity).toBe('warn');
  expect(diagnostics[0]?.group).toBe('swatchbook/css-options');
  expect(diagnostics[0]?.message).toMatch(/cssOptions\.baseSelector/);
  expect(diagnostics[0]?.message).toMatch(/deprecated/);
});

it('validateCssOptions groups multiple inert knobs into one diagnostic', () => {
  const { diagnostics } = validateCssOptions({
    baseSelector: ':host',
    baseScheme: 'light dark',
    modeSelectors: [{ mode: 'dark', selectors: ['@media (prefers-color-scheme: dark)'] }],
  });
  expect(diagnostics).toHaveLength(1);
  expect(diagnostics[0]?.message).toMatch(/baseSelector/);
  expect(diagnostics[0]?.message).toMatch(/baseScheme/);
  expect(diagnostics[0]?.message).toMatch(/modeSelectors/);
});
