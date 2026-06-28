import { expect, it } from 'vitest';
import { MAX_RENDER_PX, toPixels } from '#/dimension-scale/dimension-px.ts';

it('converts px and rem dimension values to pixels', () => {
  expect(toPixels({ value: 16, unit: 'px' })).toBe(16);
  expect(toPixels({ value: 1, unit: 'rem' })).toBe(16);
});

it('scales rem against the supplied root font-size; px stays absolute', () => {
  expect(toPixels({ value: 1, unit: 'rem' }, 20)).toBe(20);
  expect(toPixels({ value: 2, unit: 'rem' }, 10)).toBe(20);
  expect(toPixels({ value: 16, unit: 'px' }, 20)).toBe(16);
});

it('returns NaN for units it cannot approximate and for malformed values', () => {
  expect(toPixels({ value: 5, unit: '%' })).toBeNaN();
  // `em` is not a DTCG dimension unit (px | rem only): treat it as uncappable.
  expect(toPixels({ value: 2, unit: 'em' })).toBeNaN();
  expect(toPixels({ value: '5', unit: 'px' })).toBeNaN();
  expect(toPixels(null)).toBeNaN();
  expect(toPixels('16px')).toBeNaN();
});

it('exposes the render cap', () => {
  expect(MAX_RENDER_PX).toBe(480);
});
