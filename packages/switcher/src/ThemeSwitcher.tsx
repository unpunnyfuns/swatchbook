import cx from 'clsx';
import React, { type KeyboardEvent, type ReactElement } from 'react';
import './ThemeSwitcher.css';
import type { SwitcherAxis, SwitcherPreset, SwitcherPermutation } from '#/types.ts';

export interface ThemeSwitcherProps {
  /** Project axes the UI renders one section per. */
  axes: readonly SwitcherAxis[];
  /** Saved preset snapshots rendered above the axes, if any. */
  presets?: readonly SwitcherPreset[];
  /** Full permutation list — only consulted for the "modified since preset applied" dot. */
  permutations?: readonly SwitcherPermutation[];
  /** Active axis tuple, keyed by axis name. */
  activeTuple: Readonly<Record<string, string>>;
  /** Default tuple used to fill in omitted preset axes. */
  defaults: Readonly<Record<string, string>>;
  /** Name of the most recently applied preset, or null. Drives the "modified" dot. */
  lastApplied: string | null;
  /** Receives an axis name + new context. */
  onAxisChange(axisName: string, next: string): void;
  /** Called with the full preset object when the user clicks a preset pill. */
  onPresetApply(preset: SwitcherPreset): void;
  /** Optional key handler, usually used by consumers to close a popover on Escape. */
  onKeyDown?(event: KeyboardEvent<HTMLDivElement>): void;
  /** Host-specific content rendered after the axes (e.g. the Storybook addon's color-format picker). */
  footer?: ReactElement | null;
}

/**
 * Popover body for the swatchbook theme switcher. Renders preset pills
 * (when the project ships any) and one row per axis. Color-format
 * selection is specific to the Storybook addon (it toggles how blocks
 * stringify colors); hosts that need it slot
 * `<ColorFormatSelector>` into the `footer` prop rather than it being
 * baked into every consumer.
 *
 * Consumers own the trigger + positioning — the switcher just draws
 * the menu. Uses classic JSX so it survives embedding in Storybook's
 * manager bundle (which doesn't expose `react/jsx-runtime`).
 */
export function ThemeSwitcher({
  axes,
  presets = [],
  permutations = [],
  activeTuple,
  defaults,
  lastApplied,
  onAxisChange,
  onPresetApply,
  onKeyDown,
  footer,
}: ThemeSwitcherProps): ReactElement {
  return (
    // `role="group"` + `aria-label` — the switcher is a settings panel
    // (presets, per-axis selectors, color-format pills), not a command
    // menu. WAI-ARIA `menu` would require `menuitem`-rolled children plus
    // a roving tabindex; the actual content is a panel of independent
    // controls each of which already exposes its own role + state.
    <div
      role="group"
      aria-label="Swatchbook controls"
      tabIndex={-1}
      className="sb-switcher"
      onKeyDown={onKeyDown}
      data-testid="swatchbook-switcher"
    >
      {presets.length > 0 && (
        <>
          <PresetsSection
            presets={presets}
            axes={axes}
            permutations={permutations}
            defaults={defaults}
            activeTuple={activeTuple}
            lastApplied={lastApplied}
            onApply={onPresetApply}
          />
          <div className="sb-switcher__divider" />
        </>
      )}

      {axes.map((axis) => (
        <AxisSection
          key={`axis-${axis.name}`}
          axis={axis}
          active={activeTuple[axis.name] ?? axis.default}
          onSelect={(next) => onAxisChange(axis.name, next)}
        />
      ))}

      {footer && (
        <>
          <div className="sb-switcher__divider" />
          {footer}
        </>
      )}
    </div>
  );
}

interface OptionPillProps {
  label: string;
  active: boolean;
  title?: string;
  onClick(): void;
  trailing?: ReactElement | null;
}

function OptionPill({ label, active, title, onClick, trailing }: OptionPillProps): ReactElement {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      // Skip focus on mouse click so host permutations that paint a :focus
      // border-color don't stick it on the previously-clicked pill.
      // Keyboard tabbing still lands focus normally; only preventDefault
      // on mousedown blocks the implicit focus-on-click behavior.
      onMouseDown={(event) => event.preventDefault()}
      className={cx('sb-switcher__pill', active && 'sb-switcher__pill--active')}
    >
      {label}
      {trailing ?? null}
    </button>
  );
}

interface PresetsSectionProps {
  presets: readonly SwitcherPreset[];
  axes: readonly SwitcherAxis[];
  permutations: readonly SwitcherPermutation[];
  defaults: Readonly<Record<string, string>>;
  activeTuple: Readonly<Record<string, string>>;
  lastApplied: string | null;
  onApply(preset: SwitcherPreset): void;
}

function PresetsSection({
  presets,
  axes,
  defaults,
  activeTuple,
  lastApplied,
  onApply,
}: PresetsSectionProps): ReactElement {
  return (
    <div>
      <div className="sb-switcher__section-label">Presets</div>
      <div className="sb-switcher__section-body">
        {presets.map((preset) => {
          const tuple = presetTuple(preset, axes, defaults);
          const matches = tuplesEqual(tuple, activeTuple, axes);
          const modified = !matches && preset.name === lastApplied;
          const title = preset.description ? `${preset.name} — ${preset.description}` : preset.name;
          return (
            <OptionPill
              key={`preset/${preset.name}`}
              label={preset.name}
              active={matches}
              title={title}
              onClick={() => onApply(preset)}
              trailing={
                modified ? <span aria-hidden className="sb-switcher__pill-modified" /> : null
              }
            />
          );
        })}
      </div>
    </div>
  );
}

interface AxisSectionProps {
  axis: SwitcherAxis;
  active: string;
  onSelect(next: string): void;
}

function AxisSection({ axis, active, onSelect }: AxisSectionProps): ReactElement {
  return (
    <div className="sb-switcher__axis-row">
      <div className="sb-switcher__axis-label" title={axis.description}>
        {displayLabelFor(axis)}
      </div>
      <div className="sb-switcher__axis-pills">
        {axis.contexts.map((ctx) => (
          <OptionPill
            key={`${axis.name}/${ctx}`}
            label={ctx}
            active={ctx === active}
            onClick={() => onSelect(ctx)}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Treat the `{ name: 'theme', source: 'synthetic' }` axis — the one core
 * fabricates for single-theme projects with no resolver — as a special case
 * that reads as "Permutation". Authored single-axis resolvers keep their real
 * name (e.g. `mode`, `brand`).
 */
function displayLabelFor(axis: SwitcherAxis): string {
  if (axis.source === 'synthetic' && axis.name === 'theme') return 'Permutation';
  return axis.name;
}

/**
 * Compose a preset's sanitized partial tuple with the axis defaults, so
 * applying a preset that only names some axes leaves the omitted ones at
 * their defaults (not blank). Mirrors the addon preview decorator's own
 * fallback logic so what the switcher sends out matches what the host
 * honors.
 */
function presetTuple(
  preset: SwitcherPreset,
  axes: readonly SwitcherAxis[],
  defaults: Readonly<Record<string, string>>,
): Record<string, string> {
  const out: Record<string, string> = { ...defaults };
  for (const axis of axes) {
    const candidate = preset.axes[axis.name];
    if (candidate !== undefined && axis.contexts.includes(candidate)) {
      out[axis.name] = candidate;
    }
  }
  return out;
}

function tuplesEqual(
  a: Readonly<Record<string, string>>,
  b: Readonly<Record<string, string>>,
  axes: readonly SwitcherAxis[],
): boolean {
  for (const axis of axes) {
    if (a[axis.name] !== b[axis.name]) return false;
  }
  return true;
}
