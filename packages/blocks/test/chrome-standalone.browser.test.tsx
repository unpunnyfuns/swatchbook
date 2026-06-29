import '#/index.ts';
import { expect, it } from 'vitest';

it('defines the chrome vars on :root with no addon, no chrome config', () => {
  const root = getComputedStyle(document.documentElement);
  expect(root.getPropertyValue('--swatchbook-border-default').trim()).toBe('#e5e7eb');
  expect(root.getPropertyValue('--swatchbook-surface-default').trim()).toBe('#ffffff');
});

it('a chrome block appended after the base layer wins (addon-overrides-default order)', () => {
  const override = document.createElement('style');
  override.textContent = ':root { --swatchbook-border-default: rgb(1, 2, 3); }';
  document.head.appendChild(override);
  try {
    expect(getComputedStyle(document.documentElement).getPropertyValue('--swatchbook-border-default').trim())
      .toBe('rgb(1, 2, 3)');
  } finally {
    override.remove();
  }
});
