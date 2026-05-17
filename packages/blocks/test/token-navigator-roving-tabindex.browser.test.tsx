/**
 * WAI-ARIA tree pattern — roving tabindex invariants. Exactly one
 * treeitem is tab-stoppable at a time; the initial focus stop lands
 * on the first visible treeitem in DOM order.
 *
 * Arrow / expand-collapse / activation coverage lives in the sibling
 * `token-navigator-*.browser.test.tsx` files.
 */
import { cleanup, screen, within } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { renderNav, treeItem } from './_token-navigator-keyboard-helpers.tsx';

afterEach(cleanup);

it('exposes exactly one treeitem with tabIndex=0; rest are -1', () => {
  renderNav();
  const tree = screen.getByRole('tree');
  const items = within(tree).getAllByRole('treeitem');
  const focusable = items.filter((el) => el.getAttribute('tabindex') === '0');
  expect(focusable.length).toBe(1);
  const detabbed = items.filter((el) => el.getAttribute('tabindex') === '-1');
  expect(detabbed.length).toBe(items.length - 1);
});

it('places the initial focus stop on the first visible treeitem', () => {
  renderNav();
  // With initiallyExpanded=0, top-level groups (color, radius) are
  // the only visible treeitems. `color` sorts first.
  expect(treeItem('color').getAttribute('tabindex')).toBe('0');
  expect(treeItem('radius').getAttribute('tabindex')).toBe('-1');
});
