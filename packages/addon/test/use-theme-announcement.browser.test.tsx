import { renderHook, waitFor } from '@testing-library/react';
import { expect, it } from 'vitest';
import { useThemeAnnouncement } from '#/hooks/use-theme-announcement.ts';

const render = (theme: string) =>
  renderHook((p: { theme: string }) => useThemeAnnouncement(p.theme, 5), {
    initialProps: { theme },
  });

it('stays silent on initial mount', async () => {
  const { result } = render('Light · Acme');
  await new Promise((r) => setTimeout(r, 25));
  expect(result.current).toBe('');
});

it('announces when the theme changes', async () => {
  const { result, rerender } = render('Light · Acme');
  rerender({ theme: 'Dark · Acme' });
  await waitFor(() => expect(result.current).toBe('Theme: Dark · Acme'));
});

it('announces a return to the mount-time theme', async () => {
  // The bug: keying off the *initial* theme dropped this announcement, so a
  // screen-reader user flipping back to where they started heard nothing.
  const { result, rerender } = render('Light · Acme');
  rerender({ theme: 'Dark · Acme' });
  await waitFor(() => expect(result.current).toBe('Theme: Dark · Acme'));
  rerender({ theme: 'Light · Acme' });
  await waitFor(() => expect(result.current).toBe('Theme: Light · Acme'));
});
