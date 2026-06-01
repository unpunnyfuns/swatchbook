/**
 * Focus repair when the focused leaf disappears from the resolved data.
 *
 * The roving-tabindex effect repairs DOM focus to a visible treeitem when
 * the previously-focused row is removed. The reachable trigger is a
 * resolved-data change while a tree item — not the search input — holds
 * focus: flipping a toolbar axis (or a live token edit) can drop a
 * theme-specific token the user had arrow-navigated onto. On unmount the
 * browser reassigns focus to <body>; the effect must move it back onto a
 * visible row rather than leave it dead there.
 *
 * (The search path does NOT trigger this: typing keeps focus on the
 * search input, where the effect correctly declines to steal it.)
 *
 * The fixture uses single-segment paths so each token is a top-level
 * treeitem with no ancestor group — `onFocus` is focusin-based and bubbles,
 * so a leaf nested under a group would hand `storedFocus` to the group on a
 * raw `.focus()`. Top-level leaves keep `storedFocus` on the row itself,
 * matching what arrow-key navigation produces in practice.
 */
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { SwatchbookProvider, TokenNavigator } from '#/index.ts';
import type { ProjectSnapshot } from '#/index.ts';
import type { VirtualTokenShape } from '#/contexts.ts';

// `bravo` exists only in the Light theme; flipping to Dark drops it.
const LIGHT: Record<string, VirtualTokenShape> = {
  alpha: { $type: 'color', $value: { hex: '#000011' } },
  bravo: { $type: 'color', $value: { hex: '#000022' } },
  charlie: { $type: 'color', $value: { hex: '#000033' } },
};
const DARK: Record<string, VirtualTokenShape> = {
  alpha: { $type: 'color', $value: { hex: '#111011' } },
  charlie: { $type: 'color', $value: { hex: '#111033' } },
};

function snapshotFor(activeTheme: 'Light' | 'Dark'): ProjectSnapshot {
  const snap: ProjectSnapshot = {
    axes: [{ name: 'theme', contexts: ['Light', 'Dark'], default: 'Light', source: 'synthetic' }],
    defaultTuple: { theme: 'Light' },
    activeTheme,
    activeAxes: { theme: activeTheme },
    cssVarPrefix: 'sb',
    diagnostics: [],
    css: '',
  };
  snap.resolveAt = (tuple) => (tuple['theme'] === 'Dark' ? DARK : LIGHT);
  return snap;
}

const view = (theme: 'Light' | 'Dark') => (
  <SwatchbookProvider value={snapshotFor(theme)}>
    <TokenNavigator searchable={false} />
  </SwatchbookProvider>
);

afterEach(cleanup);

it('restores focus to a visible treeitem when the focused leaf is removed from the data', async () => {
  const { rerender } = render(view('Light'));

  // Focus the middle leaf — its <li> onFocus records storedFocus. Wait for
  // the roving tabindex to settle on it so the focus commit lands before the
  // flip (as it would in real use: navigate, *then* change the theme — not
  // both in one batched update).
  const focused = within(screen.getByRole('tree'))
    .getAllByRole('treeitem')
    .find((el) => el.getAttribute('data-path') === 'bravo') as HTMLLIElement;
  focused.focus();
  await waitFor(() => {
    expect(focused.getAttribute('tabindex')).toBe('0');
  });
  expect(document.activeElement).toBe(focused);

  // Flip the theme — `bravo` is no longer resolved, so its row unmounts.
  rerender(view('Dark'));

  // Focus must not be orphaned on <body>; it lands on a visible row.
  await waitFor(() => {
    expect(document.activeElement).not.toBe(document.body);
  });
  const items = within(screen.getByRole('tree')).getAllByRole('treeitem');
  expect(items).toContain(document.activeElement);
});
