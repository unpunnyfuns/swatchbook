import React, { type ReactElement } from 'react';

/**
 * Storybook-addon-specific pill row for picking how color sub-values
 * render in swatchbook blocks (hex / rgb / hsl / oklch / raw). Lives in
 * the addon rather than the shared switcher because color format is a
 * blocks-rendering concern, not a theming one — the docs-site navbar
 * switcher has no consumer for it.
 *
 * Reuses the `sb-switcher__*` class names so styling stays consistent
 * with the rest of the toolbar popover. The switcher's CSS is already
 * loaded on the page because this selector only renders inside
 * `<ThemeSwitcher>`'s `footer` prop.
 *
 * Uses `React.createElement` (via `h`) to survive embedding in Storybook's
 * manager bundle, which doesn't expose `react/jsx-runtime`.
 */

export type ColorFormat = 'hex' | 'rgb' | 'hsl' | 'oklch' | 'raw';

const COLOR_FORMAT_OPTIONS: readonly { id: ColorFormat; label: string }[] = [
  { id: 'hex', label: 'Hex' },
  { id: 'rgb', label: 'RGB' },
  { id: 'hsl', label: 'HSL' },
  { id: 'oklch', label: 'OKLCH' },
  { id: 'raw', label: 'Raw (JSON)' },
];

const h = React.createElement;

export interface ColorFormatSelectorProps {
  active: ColorFormat;
  onSelect(next: ColorFormat): void;
}

export function ColorFormatSelector({ active, onSelect }: ColorFormatSelectorProps): ReactElement {
  return h(
    'div',
    null,
    h('div', { className: 'sb-switcher__section-label' }, 'Color format'),
    h(
      'div',
      { className: 'sb-switcher__section-body' },
      ...COLOR_FORMAT_OPTIONS.map((opt) =>
        h(
          'button',
          {
            key: `color-format/${opt.id}`,
            type: 'button',
            onClick: () => onSelect(opt.id),
            onMouseDown: (event: React.MouseEvent) => event.preventDefault(),
            className:
              opt.id === active
                ? 'sb-switcher__pill sb-switcher__pill--active'
                : 'sb-switcher__pill',
          },
          opt.label,
        ),
      ),
    ),
  );
}
