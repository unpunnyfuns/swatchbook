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
import { userEvent } from '@vitest/browser/context';
import { afterEach, expect, it } from 'vitest';
import { SwatchbookProvider, TokenNavigator } from '#/index.ts';
import type { ProjectSnapshot } from '#/index.ts';
import type { VirtualTokenShape } from '#/contexts.ts';

// Same paths in both themes — only the values differ, as with a real mode flip.
const LIGHT: Record<string, VirtualTokenShape> = {
  'color.a': { $type: 'color', $value: { hex: '#000011' } },
  'color.b': { $type: 'color', $value: { hex: '#000022' } },
};
const DARK: Record<string, VirtualTokenShape> = {
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

const view = (theme: 'Light' | 'Dark') => (
  <SwatchbookProvider value={snapshotFor(theme)}>
    {/* initiallyExpanded=0 — the `color` group starts collapsed. */}
    <TokenNavigator initiallyExpanded={0} searchable={false} />
  </SwatchbookProvider>
);

const group = (path: string): HTMLLIElement =>
  within(screen.getByRole('tree'))
    .getAllByRole('treeitem')
    .find((el) => el.getAttribute('data-path') === path) as HTMLLIElement;

afterEach(cleanup);

it('keeps the user-expanded group expanded across a mode switch', async () => {
  const { rerender } = render(view('Light'));

  // Expand the `color` group (it starts collapsed at initiallyExpanded=0).
  const color = group('color');
  expect(color.getAttribute('aria-expanded')).toBe('false');
  color.focus();
  await userEvent.keyboard(' ');
  await waitFor(() => {
    expect(group('color').getAttribute('aria-expanded')).toBe('true');
  });

  // Flip the theme — same paths, different values.
  rerender(view('Dark'));

  // The expansion the user built must persist, not snap back to the default.
  expect(group('color').getAttribute('aria-expanded')).toBe('true');
});
