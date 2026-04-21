import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { type SwitcherAxis, ThemeSwitcher } from '#/index.ts';

// Classic-JSX compile: every file using `<…/>` needs React in scope.
void React;

const AXES: readonly SwitcherAxis[] = [
  {
    name: 'mode',
    contexts: ['Light', 'Dark'],
    default: 'Light',
    source: 'resolver',
  },
];

function baseProps() {
  return {
    axes: AXES,
    activeTuple: { mode: 'Light' },
    defaults: { mode: 'Light' },
    lastApplied: null,
    onAxisChange: vi.fn(),
    onPresetApply: vi.fn(),
  };
}

describe('ThemeSwitcher', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders one pill per axis context and marks the active one', () => {
    const props = baseProps();
    render(<ThemeSwitcher {...props} />);

    const switcher = screen.getByTestId('swatchbook-switcher');
    const lightPill = within(switcher).getByRole('button', { name: 'Light' });
    const darkPill = within(switcher).getByRole('button', { name: 'Dark' });

    expect(lightPill.className).toContain('sb-switcher__pill--active');
    expect(darkPill.className).not.toContain('sb-switcher__pill--active');
  });

  it('calls onAxisChange with the axis name and picked context', () => {
    const props = baseProps();
    render(<ThemeSwitcher {...props} />);

    fireEvent.click(screen.getByRole('button', { name: 'Dark' }));
    expect(props.onAxisChange).toHaveBeenCalledWith('mode', 'Dark');
  });

  it('renders a preset pill and wires its click through to onPresetApply', () => {
    const props = baseProps();
    const preset = { name: 'Brand A Dark', axes: { mode: 'Dark' } };
    render(<ThemeSwitcher {...props} presets={[preset]} />);

    fireEvent.click(screen.getByRole('button', { name: preset.name }));
    expect(props.onPresetApply).toHaveBeenCalledWith(preset);
  });

  it('marks a preset active when the tuple matches and shows a modified dot when it does not', () => {
    const props = baseProps();
    const preset = { name: 'Brand A Light', axes: { mode: 'Light' } };
    const { rerender } = render(<ThemeSwitcher {...props} presets={[preset]} />);

    const activeBtn = screen.getByRole('button', { name: preset.name });
    expect(activeBtn.className).toContain('sb-switcher__pill--active');

    rerender(
      <ThemeSwitcher
        {...props}
        presets={[preset]}
        activeTuple={{ mode: 'Dark' }}
        lastApplied={preset.name}
      />,
    );
    const modifiedBtn = screen.getByRole('button', { name: /Brand A Light/ });
    expect(modifiedBtn.className).not.toContain('sb-switcher__pill--active');
    expect(modifiedBtn.querySelector('.sb-switcher__pill-modified')).not.toBeNull();
  });

  it('renders an externally-supplied footer (for host-specific UI) when passed', () => {
    const props = baseProps();
    render(<ThemeSwitcher {...props} footer={<div data-testid="extra">host extra</div>} />);
    expect(screen.getByTestId('extra').textContent).toBe('host extra');
  });
});
