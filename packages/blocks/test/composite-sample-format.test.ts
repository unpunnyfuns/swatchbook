import { expect, it } from 'vitest';
import { formatDimension, formatSubColor } from '#/internal/composite-sample-format.ts';

it('renders an em-dash for a missing sub-field', () => {
  expect(formatDimension(null)).toBe('—');
  expect(formatDimension(undefined)).toBe('—');
});

it('formats dimension objects, numbers, and strings', () => {
  expect(formatDimension({ value: 4, unit: 'px' })).toBe('4px');
  expect(formatDimension(2)).toBe('2');
  expect(formatDimension('1rem')).toBe('1rem');
});

it('falls back to JSON for shapes it does not recognize', () => {
  expect(formatDimension({ foo: 1 })).toBe('{"foo":1}');
});

it('renders an em-dash for a missing sub-field color', () => {
  expect(formatSubColor(null, 'hex')).toBe('—');
});
