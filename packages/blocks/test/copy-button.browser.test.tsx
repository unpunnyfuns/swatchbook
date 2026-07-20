import { cleanup, render, screen } from '@testing-library/react';
import { userEvent } from 'vitest/browser';
import { afterEach, expect, it, vi } from 'vitest';
import { CopyButton } from '#/internal/CopyButton.tsx';

afterEach(() => {
  cleanup();
});

// Headless Chromium denies the clipboard-write permission, so
// `navigator.clipboard.writeText` rejects regardless of the click. Its
// `writeText` isn't spyable, so stub the whole `clipboard` object. `clipboard`
// is an inherited accessor on `Navigator.prototype`; restore by descriptor
// (deleting the own stub when there was no own property) so nothing is left
// shadowing that accessor for later tests.
function stubClipboard() {
  const writeText = vi.fn().mockResolvedValue(undefined);
  const original = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
  const restore = () => {
    if (original) Object.defineProperty(navigator, 'clipboard', original);
    else Reflect.deleteProperty(navigator, 'clipboard');
  };
  return { writeText, restore };
}

it('writes the exact value to the clipboard when clicked', async () => {
  const { writeText, restore } = stubClipboard();
  try {
    render(<CopyButton value="color: var(--sb-color-accent-bg);" />);
    await userEvent.click(screen.getByRole('button'));
    await expect.poll(() => writeText.mock.calls).toEqual([['color: var(--sb-color-accent-bg);']]);
  } finally {
    restore();
  }
});

it('toggles the visible "Copied" affordance when clicked', async () => {
  const { restore } = stubClipboard();
  try {
    render(<CopyButton value="color: var(--sb-color-accent-bg);" />);
    const button = screen.getByRole('button');
    expect(button.getAttribute('data-copied')).toBeNull();
    await userEvent.click(button);
    await expect.poll(() => button.getAttribute('data-copied')).toBe('true');
  } finally {
    restore();
  }
});
