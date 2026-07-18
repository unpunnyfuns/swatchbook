import { cleanup, render, screen } from '@testing-library/react';
import { userEvent } from 'vitest/browser';
import { afterEach, expect, it, vi } from 'vitest';
import { ConsumerOutputView } from '#/token-detail/ConsumerOutput.tsx';
import type { ConsumerOutputViewProps } from '#/token-detail/ConsumerOutput.tsx';

// The View renders from plain props — no provider, no store.
function setup(extra: Partial<ConsumerOutputViewProps> = {}) {
  return render(
    <ConsumerOutputView
      path="color.accent.bg"
      cssVar="var(--sb-color-accent-bg)"
      activeAxes={{}}
      hasToken
      extraPlatforms={[]}
      {...extra}
    />,
  );
}

afterEach(() => {
  cleanup();
});

it('renders Path + CSS rows with no extra platforms', () => {
  setup();
  expect(screen.getByTestId('consumer-output-path').textContent).toBe('color.accent.bg');
  expect(screen.getByTestId('consumer-output-css').textContent).toBe('var(--sb-color-accent-bg)');
  expect(screen.queryByTestId('consumer-output-swift')).toBeNull();
});

it('renders one row per extra platform entry', () => {
  setup({
    extraPlatforms: [
      { platform: 'android', label: 'Android', value: '@color/accent_bg' },
      { platform: 'swift', label: 'Swift', value: 'Color.accentBg' },
    ],
  });
  expect(screen.getByTestId('consumer-output-android').textContent).toBe('@color/accent_bg');
  expect(screen.getByTestId('consumer-output-swift').textContent).toBe('Color.accentBg');
});

it('shows the active tuple label derived from activeAxes', () => {
  setup({ activeAxes: { theme: 'Light', brand: 'acme' } });
  screen.getByText('theme=Light, brand=acme', { exact: false });
});

it('renders nothing when hasToken is false', () => {
  const { container } = setup({ hasToken: false });
  expect(container.textContent).toBe('');
});

it('toggles the copy button feedback to "Copied" when clicked, using local state', async () => {
  // Headless Chromium denies the clipboard-write permission outright, so
  // `navigator.clipboard.writeText` rejects regardless of the click. Stub it
  // to isolate what this test actually checks: the View's own local
  // `copied` state toggle, not the browser's clipboard permission model.
  const originalClipboard = navigator.clipboard;
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
    configurable: true,
  });

  try {
    setup();
    const button = screen.getByTestId('consumer-output-path-copy');
    expect(button.textContent).toBe('Copy');
    await userEvent.click(button);
    await expect.poll(() => button.textContent).toBe('Copied');
  } finally {
    Object.defineProperty(navigator, 'clipboard', {
      value: originalClipboard,
      configurable: true,
    });
  }
});

it('copies the token path when the path copy button is clicked', async () => {
  const originalClipboard = navigator.clipboard;
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText },
    configurable: true,
  });

  try {
    setup();
    await userEvent.click(screen.getByTestId('consumer-output-path-copy'));
    await expect.poll(() => writeText).toHaveBeenCalledWith('color.accent.bg');
  } finally {
    Object.defineProperty(navigator, 'clipboard', {
      value: originalClipboard,
      configurable: true,
    });
  }
});

it('copies the CSS variable when the CSS copy button is clicked', async () => {
  const originalClipboard = navigator.clipboard;
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText },
    configurable: true,
  });

  try {
    setup();
    await userEvent.click(screen.getByTestId('consumer-output-css-copy'));
    await expect.poll(() => writeText).toHaveBeenCalledWith('var(--sb-color-accent-bg)');
  } finally {
    Object.defineProperty(navigator, 'clipboard', {
      value: originalClipboard,
      configurable: true,
    });
  }
});
