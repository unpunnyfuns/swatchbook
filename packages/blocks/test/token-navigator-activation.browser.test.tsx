/**
 * WAI-ARIA tree pattern — activation keys. Enter on a leaf fires
 * `onSelect` with the leaf's path; Space toggles a group's expanded
 * state (same effect as Right when collapsed, Left when expanded).
 *
 * Roving-tabindex / arrow-navigation / expand-collapse coverage lives
 * in the sibling `token-navigator-*.browser.test.tsx` files.
 */
import { userEvent } from '@vitest/browser/context';
import { cleanup } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { renderNav, treeItem } from './_token-navigator-keyboard-helpers.tsx';

afterEach(cleanup);

it('Enter on a leaf fires onSelect with the path', async () => {
  const onSelect = vi.fn();
  renderNav({ initiallyExpanded: 1, onSelect });
  treeItem('color.bg').focus();
  await userEvent.keyboard('{Enter}');
  expect(onSelect).toHaveBeenCalledWith('color.bg');
});

it('Space toggles a group (same effect as Right when collapsed, Left when expanded)', async () => {
  renderNav();
  treeItem('color').focus();
  expect(treeItem('color').getAttribute('aria-expanded')).toBe('false');
  await userEvent.keyboard(' ');
  expect(treeItem('color').getAttribute('aria-expanded')).toBe('true');
  await userEvent.keyboard(' ');
  expect(treeItem('color').getAttribute('aria-expanded')).toBe('false');
});
