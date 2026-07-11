/**
 * Expand/collapse state must survive a settings change.
 *
 * `resolved` gets a fresh identity on every axis flip (it is recomputed per
 * active tuple), so anything the navigator memoizes off it — including the
 * derived `initialExpanded` set — churns identity on a mode switch. The
 * expand/collapse state the user built up must NOT be reset back to the
 * `initiallyExpanded` default when only token values change underneath.
 */
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from 'vitest/browser';
import { afterEach, expect, it } from 'vitest';
import { SwatchbookProvider, TokenNavigator } from '#/index.ts';
import type { ProjectSnapshot } from '#/index.ts';
import type { VirtualToken } from '#/types.ts';

// Same paths in both themes — only the values differ, as with a real mode flip.
const LIGHT: Record<string, VirtualToken> = {
  'color.a': { $type: 'color', $value: { hex: '#000011' } },
  'color.b': { $type: 'color', $value: { hex: '#000022' } },
};
const DARK: Record<string, VirtualToken> = {
  'color.a': { $type: 'color', $value: { hex: '#111011' } },
  'color.b': { $type: 'color', $value: { hex: '#111022' } },
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

// `id` scopes the navigator's persisted UI state; each test passes its own so
// the module-level store doesn't leak expand state between tests.
const view = (theme: 'Light' | 'Dark', id: string) => (
  <SwatchbookProvider value={snapshotFor(theme)}>
    {/* initiallyExpanded=0 — the `color` group starts collapsed. */}
    <TokenNavigator initiallyExpanded={0} searchable={false} id={id} />
  </SwatchbookProvider>
);

const group = (path: string): HTMLLIElement =>
  within(screen.getByRole('tree'))
    .getAllByRole('treeitem')
    .find((el) => el.getAttribute('data-path') === path) as HTMLLIElement;

afterEach(cleanup);

it('keeps the user-expanded group expanded across a mode switch', async () => {
  const { rerender } = render(view('Light', 'rerender'));

  // Expand the `color` group (it starts collapsed at initiallyExpanded=0).
  const color = group('color');
  expect(color.getAttribute('aria-expanded')).toBe('false');
  color.focus();
  await userEvent.keyboard(' ');
  await waitFor(() => {
    expect(group('color').getAttribute('aria-expanded')).toBe('true');
  });

  // Flip the theme — same paths, different values.
  rerender(view('Dark', 'rerender'));

  // The expansion the user built must persist, not snap back to the default.
  expect(group('color').getAttribute('aria-expanded')).toBe('true');
});

it('keeps the user-expanded group expanded across a full remount (docs mode)', async () => {
  // MDX docs mode does NOT rerender in place: Storybook re-renders the docs
  // container on a globals change, which unmounts and remounts the embedded
  // block entirely. Plain component state dies on that remount, so expand
  // state must be persisted somewhere that survives it.
  const { unmount } = render(view('Light', 'remount'));

  const color = group('color');
  expect(color.getAttribute('aria-expanded')).toBe('false');
  color.focus();
  await userEvent.keyboard(' ');
  await waitFor(() => {
    expect(group('color').getAttribute('aria-expanded')).toBe('true');
  });

  // Destroy and recreate the block, as a docs-mode axis flip does.
  unmount();
  render(view('Dark', 'remount'));

  expect(group('color').getAttribute('aria-expanded')).toBe('true');
});

it('keeps the open detail drawer open across a full remount (docs mode)', async () => {
  const { unmount } = render(view('Light', 'drawer'));

  // Expand the group, then open a leaf's detail drawer.
  group('color').focus();
  await userEvent.keyboard(' ');
  await waitFor(() => {
    expect(group('color').getAttribute('aria-expanded')).toBe('true');
  });
  await userEvent.click(group('color.a'));
  expect(screen.queryByRole('dialog')).not.toBeNull();

  // Full remount, as a docs-mode axis flip does — the drawer must stay open.
  unmount();
  render(view('Dark', 'drawer'));

  expect(screen.queryByRole('dialog')).not.toBeNull();
});
