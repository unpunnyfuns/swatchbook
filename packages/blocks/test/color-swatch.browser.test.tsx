import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { ColorSwatch } from '#/presenters/ColorSwatch.tsx';
import type { RealisedToken } from '@unpunnyfuns/swatchbook-core/token-value-types';

const token: RealisedToken<'color'> = { $type: 'color', $value: { hex: '#3b82f6' } };

afterEach(() => cleanup());

it('renders the leaf label and a value from $value when no cssVar', () => {
  const { container } = render(
    <ColorSwatch path="color.brand.primary" token={token} colorFormat="hex" />,
  );
  screen.getByText('primary');
  const chip = container.querySelector<HTMLElement>('.sb-color-swatch__chip');
  expect(chip?.style.background).not.toContain('var(');
});

it('uses cssVar for the chip when supplied', () => {
  const { container } = render(
    <ColorSwatch
      path="color.brand.primary"
      token={token}
      cssVar="var(--sb-color-brand-primary)"
      colorFormat="hex"
    />,
  );
  expect(container.querySelector<HTMLElement>('.sb-color-swatch__chip')?.style.background).toBe(
    'var(--sb-color-brand-primary)',
  );
});

it('uses options.label over the bare leaf when supplied (grouped consumer context)', () => {
  render(
    <ColorSwatch
      path="color.palette.blue.50"
      token={token}
      colorFormat="hex"
      options={{ label: 'blue.50' }}
    />,
  );
  screen.getByText('blue.50');
  expect(screen.queryByText('50')).toBeNull();
});

it('falls back to the bare leaf when options.label is absent (standalone usage)', () => {
  render(<ColorSwatch path="color.palette.blue.50" token={token} colorFormat="hex" />);
  screen.getByText('50');
});

it('renders a JSON value with the chip still painting a real color when colorFormat is raw', () => {
  const { container } = render(
    <ColorSwatch path="color.brand.primary" token={token} colorFormat="raw" />,
  );
  const chip = container.querySelector<HTMLElement>('.sb-color-swatch__chip');
  expect(chip?.style.background).not.toContain('var(');
  expect(chip?.style.background).not.toBe('');
  screen.getByText(/colorSpace/);
});
