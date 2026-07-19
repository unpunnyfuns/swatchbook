import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import type { RealisedToken } from '@unpunnyfuns/swatchbook-core/token-value-types';
import { TypeSpecimen } from '#/presenters/TypeSpecimen.tsx';

const token: RealisedToken<'typography'> = {
  $type: 'typography',
  $value: {
    fontFamily: 'Inter',
    fontSize: { value: 24, unit: 'px' },
    fontWeight: 700,
    lineHeight: 1.2,
    letterSpacing: { value: 0.5, unit: 'px' },
  },
};

afterEach(() => cleanup());

it('styles the sample from the realised value when no cssVar is given', () => {
  const { container } = render(
    <TypeSpecimen path="typography.heading" token={token} colorFormat="hex" />,
  );
  const sample = container.querySelector<HTMLElement>('.sb-type-specimen__sample');
  expect(sample?.style.fontSize).toBe('24px');
  expect(sample?.style.fontSize).not.toContain('var(');
  expect(sample?.style.fontWeight).toBe('700');
  expect(sample?.style.letterSpacing).toBe('0.5px');
});

it('shows a derived spec summary without a token-identity label', () => {
  render(<TypeSpecimen path="typography.heading" token={token} colorFormat="hex" />);
  screen.getByText('24px · w700 · lh 1.2');
  expect(screen.queryByText('heading')).toBeNull();
});

it('shows the sample text', () => {
  render(
    <TypeSpecimen
      path="typography.heading"
      token={token}
      colorFormat="hex"
      options={{ sample: 'Sphinx of black quartz' }}
    />,
  );
  screen.getByText('Sphinx of black quartz');
});

it('prefers $description over the derived spec summary when the token has one', () => {
  const described: RealisedToken<'typography'> = { ...token, $description: 'Primary heading' };
  render(<TypeSpecimen path="typography.heading" token={described} colorFormat="hex" />);
  screen.getByText('Primary heading');
  expect(screen.queryByText('24px · w700 · lh 1.2')).toBeNull();
});

// Terrazzo's generateShorthand assigns a typography token's base css var the
// `font` shorthand value (style weight size/line-height family), so cssVar
// applies directly to the sample's `font` property.
it('applies cssVar to the sample via the font shorthand', () => {
  const { container } = render(
    <TypeSpecimen
      path="typography.heading"
      token={token}
      cssVar="var(--sb-typography-heading)"
      colorFormat="hex"
    />,
  );
  const sample = container.querySelector<HTMLElement>('.sb-type-specimen__sample');
  expect(sample?.style.font).toBe('var(--sb-typography-heading)');
  expect(sample?.style.fontSize).toBe('');
});
