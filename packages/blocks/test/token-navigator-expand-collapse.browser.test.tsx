/**
 * WAI-ARIA tree pattern — Right/Left arrow expand+collapse semantics.
 * Right on a collapsed group expands; Right again steps into the
 * first child. Left on an expanded group collapses; Left on a leaf
 * steps focus to the parent.
 *
 * Roving-tabindex / arrow-navigation / activation coverage lives in
 * the sibling `token-navigator-*.browser.test.tsx` files.
 */
import { userEvent } from '@vitest/browser/context';
import { cleanup } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { renderNav, treeItem } from './_token-navigator-keyboard-helpers.tsx';

afterEach(cleanup);

it('Right on a collapsed group expands it; Right again steps into the first child', async () => {
  renderNav();
  treeItem('color').focus();
  expect(treeItem('color').getAttribute('aria-expanded')).toBe('false');
  await userEvent.keyboard('{ArrowRight}');
  expect(treeItem('color').getAttribute('aria-expanded')).toBe('true');
  // Focus stays on the group; the children mounted on this render.
  expect(document.activeElement).toBe(treeItem('color'));
  await userEvent.keyboard('{ArrowRight}');
  // First child of `color` is the `color.palette` group (groups
  // sort before leaves at the same depth).
  expect(document.activeElement).toBe(treeItem('color.palette'));
});

it('Left on an expanded group collapses it', async () => {
  renderNav({ initiallyExpanded: 1 });
  expect(treeItem('color').getAttribute('aria-expanded')).toBe('true');
  treeItem('color').focus();
  await userEvent.keyboard('{ArrowLeft}');
  expect(treeItem('color').getAttribute('aria-expanded')).toBe('false');
  // Children gone; focus stays on the group.
  expect(document.activeElement).toBe(treeItem('color'));
});

it('Left on a leaf steps focus to the parent group', async () => {
  renderNav({ initiallyExpanded: 1 });
  treeItem('color.bg').focus();
  await userEvent.keyboard('{ArrowLeft}');
  expect(document.activeElement).toBe(treeItem('color'));
});
