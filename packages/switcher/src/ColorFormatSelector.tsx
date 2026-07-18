import React from 'react';
import type { ReactElement } from 'react';
import type { ColorFormat } from '#/types.ts';

/**
 * Hand-listed labels for {@link COLOR_FORMATS}. Exported for the parity
 * test (`packages/switcher/test/color-format-parity.test.ts`) that guards
 * this list against drifting from core's canonical `COLOR_FORMATS` order.
 */
export const COLOR_FORMAT_OPTIONS: readonly { id: ColorFormat; label: string }[] = [
  { id: 'hex', label: 'Hex' },
  { id: 'rgb', label: 'RGB' },
  { id: 'hsl', label: 'HSL' },
  { id: 'oklch', label: 'OKLCH' },
  { id: 'raw', label: 'Raw (JSON)' },
];

interface ColorFormatSelectorProps {
  active: ColorFormat;
  onSelect(next: ColorFormat): void;
}

/**
 * Pill row for picking how color sub-values render in swatchbook blocks
 * (hex / rgb / hsl / oklch / raw). Neither switcher mount (the Storybook
 * addon toolbar, the docs navbar) renders this by default — blocks read
 * `Config.defaultColorFormat` for their starting format instead. Exported
 * for hosts that want to slot a color-format control into
 * `<ThemeSwitcher>`'s `footer` themselves.
 *
 * Reuses the `sb-switcher__*` class names so styling matches the rest of
 * the popover; relies on the host having already loaded `ThemeSwitcher.css`
 * (true whenever this renders inside `<ThemeSwitcher>`'s `footer`).
 */
export function ColorFormatSelector({ active, onSelect }: ColorFormatSelectorProps): ReactElement {
  return (
    <div>
      <div className="sb-switcher__section-label" id="sb-color-format-label">
        Color format
      </div>
      <div
        className="sb-switcher__section-body"
        role="group"
        aria-labelledby="sb-color-format-label"
      >
        {COLOR_FORMAT_OPTIONS.map((opt) => {
          const isActive = opt.id === active;
          return (
            <button
              key={`color-format/${opt.id}`}
              type="button"
              aria-pressed={isActive}
              aria-label={`${opt.label} color format`}
              onClick={() => onSelect(opt.id)}
              className={
                isActive ? 'sb-switcher__pill sb-switcher__pill--active' : 'sb-switcher__pill'
              }
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
