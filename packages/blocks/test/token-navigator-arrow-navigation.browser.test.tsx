/**
 * WAI-ARIA tree pattern — arrow-key traversal. Up / Down step through
 * visible treeitems in DOM order; Home / End jump to first / last.
 * Real-browser via vitest-browser so the focus moves reflect what
 * the live tab order does, not a jsdom approximation.
 *
 * Roving-tabindex / expand-collapse / activation coverage lives in
 * the sibling `token-navigator-*.browser.test.tsx` files.
 */
import { userEvent } from '@vitest/browser/context';
import { cleanup } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { renderNav, treeItem } from './_token-navigator-keyboard-helpers.tsx';

afterEach(cleanup);

it('Down moves focus to the next visible treeitem', async () => {
  renderNav();
  treeItem('color').focus();
  await userEvent.keyboard('{ArrowDown}');
  expect(document.activeElement).toBe(treeItem('radius'));
  expect(treeItem('radius').getAttribute('tabindex')).toBe('0');
  expect(treeItem('color').getAttribute('tabindex')).toBe('-1');
});

it('Up moves focus to the previous visible treeitem', async () => {
  renderNav();
  treeItem('radius').focus();
  await userEvent.keyboard('{ArrowUp}');
  expect(document.activeElement).toBe(treeItem('color'));
});

it('Home jumps to the first treeitem; End jumps to the last', async () => {
  renderNav();
  treeItem('color').focus();
  await userEvent.keyboard('{End}');
  expect(document.activeElement).toBe(treeItem('radius'));
  await userEvent.keyboard('{Home}');
  expect(document.activeElement).toBe(treeItem('color'));
});
