import { expect, it } from 'vitest';
import { MAX_RENDER_PX, toPixels } from '#/dimension-scale/dimension-px.ts';

it('converts px / rem / em dimension values to pixels', () => {
  expect(toPixels({ value: 16, unit: 'px' })).toBe(16);
  expect(toPixels({ value: 1, unit: 'rem' })).toBe(16);
  expect(toPixels({ value: 2, unit: 'em' })).toBe(32);
});

it('returns NaN for units it cannot approximate and for malformed values', () => {
  expect(toPixels({ value: 5, unit: '%' })).toBeNaN();
  expect(toPixels({ value: '5', unit: 'px' })).toBeNaN();
  expect(toPixels(null)).toBeNaN();
  expect(toPixels('16px')).toBeNaN();
});

it('exposes the render cap', () => {
  expect(MAX_RENDER_PX).toBe(480);
});
