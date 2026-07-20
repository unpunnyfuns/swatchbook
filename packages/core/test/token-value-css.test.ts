import { expect, it } from 'vitest';
import { formatDimension, formatTokenValue } from '@unpunnyfuns/swatchbook-core/token-value-css';

it('formats a dimension object', () => {
  expect(formatDimension({ value: 4, unit: 'px' })).toBe('4px');
});
it('formats a color token value', () => {
  expect(formatTokenValue({ hex: '#3b82f6' }, 'color', 'hex')).toBe('#3b82f6');
});

it('prefers the previewValue over a raw fontWeight primitive', () => {
  expect(formatTokenValue(700, 'fontWeight', 'hex', { names: {}, previewValue: 'bold' })).toBe(
    'bold',
  );
});

it('prefers the previewValue over a raw opacity number', () => {
  expect(formatTokenValue(0.5, 'number', 'hex', { names: {}, previewValue: '50%' })).toBe('50%');
});

it('prefers the previewValue over a single-string fontFamily', () => {
  expect(
    formatTokenValue('Geist', 'fontFamily', 'hex', {
      names: {},
      previewValue: 'Geist, sans-serif',
    }),
  ).toBe('Geist, sans-serif');
});

it('falls back to the raw primitive when there is no listing', () => {
  expect(formatTokenValue(700, 'fontWeight', 'hex')).toBe('700');
});

it('returns the previewValue for a color token on the hex format', () => {
  expect(
    formatTokenValue({ hex: '#3b82f6' }, 'color', 'hex', { names: {}, previewValue: '#3b82f6' }),
  ).toBe('#3b82f6');
});

it('ignores the previewValue for a color token on a non-hex format', () => {
  const result = formatTokenValue(
    { colorSpace: 'srgb', components: [0.23, 0.51, 0.96] },
    'color',
    'rgb',
    { names: {}, previewValue: '#3b82f6' },
  );
  expect(result).not.toBe('#3b82f6');
  expect(result).toMatch(/^rgb\(/);
});

it('returns an empty string for a null value', () => {
  expect(formatTokenValue(null, 'fontWeight', 'hex')).toBe('');
});
