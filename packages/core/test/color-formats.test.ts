import { expect, it } from 'vitest';
import { COLOR_FORMATS } from '#/color-formats.ts';

it('lists the supported color display formats in toolbar order', () => {
  expect(COLOR_FORMATS).toEqual(['hex', 'rgb', 'hsl', 'oklch', 'raw']);
});
