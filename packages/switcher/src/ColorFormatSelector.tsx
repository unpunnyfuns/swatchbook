import cx from 'clsx';
import React, { type ReactElement } from 'react';
import type { SwitcherColorFormat } from '#/types.ts';

const COLOR_FORMAT_OPTIONS: readonly { id: SwitcherColorFormat; label: string }[] = [
  { id: 'hex', label: 'Hex' },
  { id: 'rgb', label: 'RGB' },
  { id: 'hsl', label: 'HSL' },
  { id: 'oklch', label: 'OKLCH' },
  { id: 'raw', label: 'Raw (JSON)' },
];

export interface ColorFormatSelectorProps {
  /** Currently selected format. */
  active: SwitcherColorFormat;
  onSelect(next: SwitcherColorFormat): void;
}

/**
 * Storybook-addon-specific pill row for picking how color sub-values
 * render in blocks (hex / rgb / hsl / oklch / raw). Packaged alongside
 * `<ThemeSwitcher>` so the addon's toolbar can slot it into the
 * switcher's `footer` prop; hosts that don't render swatchbook blocks
 * (e.g. the docs-site navbar) simply omit it.
 */
export function ColorFormatSelector({ active, onSelect }: ColorFormatSelectorProps): ReactElement {
  return (
    <div>
      <div className="sb-switcher__section-label">Color format</div>
      <div className="sb-switcher__section-body">
        {COLOR_FORMAT_OPTIONS.map((opt) => (
          <button
            key={`color-format/${opt.id}`}
            type="button"
            onClick={() => onSelect(opt.id)}
            onMouseDown={(event) => event.preventDefault()}
            className={cx('sb-switcher__pill', opt.id === active && 'sb-switcher__pill--active')}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
