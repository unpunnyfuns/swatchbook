import { cleanup, render, screen } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { ColorFormatSelector } from '#/ColorFormatSelector.tsx';

// Classic-JSX compile: every file using `<…/>` needs React in scope.
void React;

afterEach(cleanup);

describe('ColorFormatSelector', () => {
  it('renders one pill per color format', () => {
    render(<ColorFormatSelector active="hex" onSelect={() => {}} />);
    for (const label of [
      'Hex color format',
      'RGB color format',
      'HSL color format',
      'OKLCH color format',
      'Raw (JSON) color format',
    ]) {
      expect(screen.getByRole('button', { name: label })).toBeDefined();
    }
  });

  it('marks the active pill via `aria-pressed` + the `--active` modifier class', () => {
    render(<ColorFormatSelector active="oklch" onSelect={() => {}} />);
    const active = screen.getByRole('button', { name: 'OKLCH color format' });
    expect(active.getAttribute('aria-pressed')).toBe('true');
    expect(active.className).toContain('sb-switcher__pill--active');
    const inactive = screen.getByRole('button', { name: 'Hex color format' });
    expect(inactive.getAttribute('aria-pressed')).toBe('false');
    expect(inactive.className).not.toContain('sb-switcher__pill--active');
  });

  it("invokes `onSelect` with the pill's format id on click", async () => {
    const onSelect = vi.fn();
    render(<ColorFormatSelector active="hex" onSelect={onSelect} />);
    await userEvent.click(screen.getByRole('button', { name: 'RGB color format' }));
    expect(onSelect).toHaveBeenCalledWith('rgb');
  });

  it('generates a unique label id per instance so aria-labelledby never collides', () => {
    render(
      <>
        <ColorFormatSelector active="hex" onSelect={() => {}} />
        <ColorFormatSelector active="rgb" onSelect={() => {}} />
      </>,
    );
    const labels = screen.getAllByText('Color format');
    const groups = screen.getAllByRole('group');
    expect(labels).toHaveLength(2);
    expect(groups).toHaveLength(2);
    const [firstLabelId, secondLabelId] = labels.map((label) => label.id);
    expect(firstLabelId).not.toBe(secondLabelId);
    expect(groups[0]?.getAttribute('aria-labelledby')).toBe(firstLabelId);
    expect(groups[1]?.getAttribute('aria-labelledby')).toBe(secondLabelId);
  });
});
