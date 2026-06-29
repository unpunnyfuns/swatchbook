import '#/index.ts';
import { expect, it } from 'vitest';

it('internal color tokens resolve on :root standalone (provider ships internal-tokens.css)', () => {
  const root = getComputedStyle(document.documentElement);
  expect(root.getPropertyValue('--swatchbook-status-success').trim()).toBe('#30a46c');
  expect(root.getPropertyValue('--swatchbook-status-danger').trim()).toBe('#d64545');
  expect(root.getPropertyValue('--swatchbook-deprecated').trim()).toBe('#92400e');
});
