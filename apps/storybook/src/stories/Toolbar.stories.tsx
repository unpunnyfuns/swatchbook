/**
 * Play-function coverage for the swatchbook toolbar widget — the
 * `<ThemeSwitcher>` body the addon's manager-side popover renders.
 *
 * The toolbar trigger (`IconButton`) lives in Storybook's manager bundle
 * which play functions can't reach. The popover content itself is a
 * plain React component, so this story mounts it directly with realistic
 * fixture state and the play functions exercise the actual click
 * contracts: axis switch, preset apply, footer-slot integration, and
 * the "modified-since-preset" reset path.
 *
 * `<ColorFormatSelector>` — the real footer the addon slots into the
 * switcher in production — has its own dedicated component tests in
 * `packages/addon/test/color-format-selector.browser.test.tsx`; the
 * footer-slot story here uses a stand-in button so the integration
 * isn't coupled to the selector's specifics.
 *
 * Refs the "Toolbar UI — zero play-function coverage" finding from
 * pre-1.0 dossier #704.
 */
import {
  type SwitcherAxis,
  type SwitcherPreset,
  ThemeSwitcher,
} from '@unpunnyfuns/swatchbook-addon';
import { type ReactElement, useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import preview from '../../.storybook/preview.tsx';

const FIXTURE_AXES: SwitcherAxis[] = [
  {
    name: 'mode',
    contexts: ['Light', 'Dark'],
    default: 'Light',
    source: 'resolver',
  },
  {
    name: 'brand',
    contexts: ['Default', 'Brand A'],
    default: 'Default',
    source: 'resolver',
  },
  {
    name: 'contrast',
    contexts: ['Normal', 'High'],
    default: 'Normal',
    source: 'resolver',
  },
];

const FIXTURE_PRESETS: SwitcherPreset[] = [
  { name: 'Marketing Dark', axes: { mode: 'Dark', brand: 'Brand A' } },
  { name: 'Accessible High', axes: { mode: 'Light', contrast: 'High' } },
];

const FIXTURE_DEFAULTS: Record<string, string> = {
  mode: 'Light',
  brand: 'Default',
  contrast: 'Normal',
};

/**
 * Test harness — owns the switcher's state and surfaces it as
 * `data-*` attributes on a sibling probe so play functions can read
 * the current selection without instrumenting the switcher itself.
 */
function ToolbarHarness(): ReactElement {
  const [activeTuple, setActiveTuple] = useState<Record<string, string>>(FIXTURE_DEFAULTS);
  const [lastApplied, setLastApplied] = useState<string | null>(null);
  const [footerClicks, setFooterClicks] = useState(0);

  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', padding: 12 }}>
      <ThemeSwitcher
        axes={FIXTURE_AXES}
        presets={FIXTURE_PRESETS}
        activeTuple={activeTuple}
        defaults={FIXTURE_DEFAULTS}
        lastApplied={lastApplied}
        onAxisChange={(name, next) => {
          setActiveTuple((prev) => ({ ...prev, [name]: next }));
          // Manual axis change clears the "last applied preset" badge.
          setLastApplied(null);
        }}
        onPresetApply={(preset) => {
          setActiveTuple({ ...FIXTURE_DEFAULTS, ...preset.axes });
          setLastApplied(preset.name);
        }}
        footer={
          // Probe-button stands in for the addon's own `ColorFormatSelector`
          // (which has dedicated unit tests in `packages/addon/test/`).
          // This story tests the switcher's footer-slot integration —
          // that host content renders + responds to clicks correctly.
          <button
            type="button"
            data-testid="footer-action"
            onClick={() => setFooterClicks((n) => n + 1)}
          >
            Footer action
          </button>
        }
      />
      <div
        data-testid="probe"
        data-mode={activeTuple['mode']}
        data-brand={activeTuple['brand']}
        data-contrast={activeTuple['contrast']}
        data-last-applied={lastApplied ?? ''}
        data-footer-clicks={String(footerClicks)}
        style={{ fontFamily: 'monospace', fontSize: 12 }}
      >
        <div>mode: {activeTuple['mode']}</div>
        <div>brand: {activeTuple['brand']}</div>
        <div>contrast: {activeTuple['contrast']}</div>
        <div>preset: {lastApplied ?? '—'}</div>
        <div>footer clicks: {footerClicks}</div>
      </div>
    </div>
  );
}

const meta = preview.meta({
  title: 'Tests/Toolbar',
  component: ToolbarHarness,
  // Stateful harness — its rendered output stays still after each
  // interaction settles. Chromatic snapshot the default Light/Default
  // state once; the per-interaction stories skip snapshotting since
  // they're assertion-only and would flicker with React state.
  parameters: { chromatic: { disableSnapshot: true } },
});

export default meta;

function probeAttr(canvasElement: HTMLElement, attr: string): string | null {
  const probe = canvasElement.querySelector<HTMLElement>('[data-testid="probe"]');
  if (!probe) throw new Error('toolbar probe missing — harness did not render');
  return probe.getAttribute(attr);
}

/**
 * Switch a single axis — clicking the `Dark` pill under the `mode`
 * section flips `activeTuple.mode` and clears the "last applied preset"
 * trail.
 */
export const SwitchAxis = meta.story({
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(probeAttr(canvasElement, 'data-mode')).toBe('Light');
    await userEvent.click(canvas.getByRole('button', { name: 'Dark' }));
    expect(probeAttr(canvasElement, 'data-mode')).toBe('Dark');
    expect(probeAttr(canvasElement, 'data-brand')).toBe('Default');
    expect(probeAttr(canvasElement, 'data-last-applied')).toBe('');
  },
});

/**
 * Apply a multi-axis preset — clicking `Marketing Dark` updates the
 * tuple to that preset's tuple and records `lastApplied`.
 */
export const SwitchPreset = meta.story({
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(probeAttr(canvasElement, 'data-last-applied')).toBe('');
    await userEvent.click(canvas.getByRole('button', { name: 'Marketing Dark' }));
    expect(probeAttr(canvasElement, 'data-mode')).toBe('Dark');
    expect(probeAttr(canvasElement, 'data-brand')).toBe('Brand A');
    // Preset omits `contrast`, so it falls back to the default.
    expect(probeAttr(canvasElement, 'data-contrast')).toBe('Normal');
    expect(probeAttr(canvasElement, 'data-last-applied')).toBe('Marketing Dark');
  },
});

/**
 * Footer slot integration — host content (the addon uses
 * `<ColorFormatSelector>` here; the story uses a stand-in button to
 * decouple from the selector's own tests in `packages/addon/test/`)
 * renders alongside the axis rows and receives clicks normally.
 */
export const FooterSlot = meta.story({
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(probeAttr(canvasElement, 'data-footer-clicks')).toBe('0');
    await userEvent.click(canvas.getByTestId('footer-action'));
    expect(probeAttr(canvasElement, 'data-footer-clicks')).toBe('1');
    await userEvent.click(canvas.getByTestId('footer-action'));
    expect(probeAttr(canvasElement, 'data-footer-clicks')).toBe('2');
  },
});

/**
 * Manual axis change after applying a preset clears the
 * `lastApplied` trail — the "modified" dot logic depends on this
 * reset.
 */
export const AxisChangeClearsPreset = meta.story({
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Marketing Dark' }));
    expect(probeAttr(canvasElement, 'data-last-applied')).toBe('Marketing Dark');
    // Drift away from the preset by picking a different brand.
    await userEvent.click(canvas.getByRole('button', { name: 'Default' }));
    expect(probeAttr(canvasElement, 'data-last-applied')).toBe('');
    expect(probeAttr(canvasElement, 'data-brand')).toBe('Default');
    // Mode still reflects the preset's earlier application.
    expect(probeAttr(canvasElement, 'data-mode')).toBe('Dark');
  },
});
