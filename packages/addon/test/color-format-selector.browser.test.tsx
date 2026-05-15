import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ColorFormatSelector } from '#/ColorFormatSelector.tsx';

afterEach(cleanup);

describe('ColorFormatSelector', () => {
  it('renders one pill per color format', () => {
    render(<ColorFormatSelector active="hex" onSelect={() => {}} />);
    for (const label of ['Hex', 'RGB', 'HSL', 'OKLCH', 'Raw (JSON)']) {
      expect(screen.getByRole('button', { name: label })).toBeDefined();
    }
  });

  it('marks the active pill with the `--active` modifier class', () => {
    render(<ColorFormatSelector active="oklch" onSelect={() => {}} />);
    const active = screen.getByRole('button', { name: 'OKLCH' });
    expect(active.className).toContain('sb-switcher__pill--active');
    const inactive = screen.getByRole('button', { name: 'Hex' });
    expect(inactive.className).not.toContain('sb-switcher__pill--active');
  });

  it("invokes `onSelect` with the pill's format id on click", () => {
    const onSelect = vi.fn();
    render(<ColorFormatSelector active="hex" onSelect={onSelect} />);
    fireEvent.click(screen.getByRole('button', { name: 'RGB' }));
    expect(onSelect).toHaveBeenCalledWith('rgb');
  });

  it('prevents default on mousedown so the toolbar popover keeps focus', () => {
    // The popover uses an outside-mousedown listener to close; if pill
    // mousedown bubbled normally, the popover would close before the
    // click handler ran. Preventing default keeps the popover open.
    render(<ColorFormatSelector active="hex" onSelect={() => {}} />);
    const button = screen.getByRole('button', { name: 'RGB' });
    const event = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
    button.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });
});
