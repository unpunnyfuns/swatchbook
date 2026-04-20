import { expect, waitFor } from 'storybook/test';
import preview from '../../.storybook/preview.tsx';
import { Button } from '../components/Button.tsx';
import { Card } from '../components/Card.tsx';

function ThemeProbe() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 12 }}>
      <Card data-testid="probe-card" title="Probe card">
        Surface-driven — flips with Light ↔ Dark.
      </Card>
      <Button data-testid="probe-button" variant="primary">
        Accent-driven — flips with Brand A.
      </Button>
    </div>
  );
}

const meta = preview.meta({
  title: 'Tests/ThemeSwitch',
  component: ThemeProbe,
});

export default meta;

function bgOf(el: Element): string {
  return getComputedStyle(el).backgroundColor;
}

function parseRgb(value: string): [number, number, number] {
  const match = value.match(/\d+(?:\.\d+)?/g);
  if (!match || match.length < 3) throw new Error(`Not an rgb value: ${value}`);
  return [Number(match[0]), Number(match[1]), Number(match[2])];
}

async function bgWhenMounted(el: Element): Promise<string> {
  await waitFor(() => {
    const bg = bgOf(el);
    if (!bg || bg === 'rgba(0, 0, 0, 0)') throw new Error('bg not yet resolved');
  });
  return bgOf(el);
}

/**
 * Light surface (color.surface.raised → color.neutral.0, i.e. white).
 * Component channels should all be near 255.
 */
export const Light = meta.story({
  parameters: { swatchbook: { axes: { mode: 'Light', brand: 'Default' } } },
  play: async ({ canvasElement }) => {
    const card = canvasElement.querySelector<HTMLElement>('[data-testid="probe-card"]');
    if (!card) throw new Error('probe-card missing');
    const bg = await bgWhenMounted(card);
    const [r, g, b] = parseRgb(bg);
    expect(
      Math.min(r, g, b),
      `Light card surface should be near-white; got rgb(${r},${g},${b})`,
    ).toBeGreaterThan(240);
  },
});

/**
 * Dark surface (color.surface.raised → color.neutral.800, near-black).
 * Component channels should all be low.
 */
export const Dark = meta.story({
  parameters: { swatchbook: { axes: { mode: 'Dark', brand: 'Default' } } },
  play: async ({ canvasElement }) => {
    const card = canvasElement.querySelector<HTMLElement>('[data-testid="probe-card"]');
    if (!card) throw new Error('probe-card missing');
    const bg = await bgWhenMounted(card);
    const [r, g, b] = parseRgb(bg);
    expect(
      Math.max(r, g, b),
      `Dark card surface should be near-black; got rgb(${r},${g},${b})`,
    ).toBeLessThan(60);
  },
});

/**
 * Stacked composition: Brand A overrides `color.accent.bg` from blue to
 * violet. The button (whose styles read `var(--sb-color-accent-bg)` directly)
 * must render with a red channel that exceeds the blue channel — violet's
 * defining property — whereas plain Light/Dark accents are blue-dominant.
 */
export const LightBrandA = meta.story({
  parameters: { swatchbook: { axes: { mode: 'Light', brand: 'Brand A' } } },
  play: async ({ canvasElement }) => {
    const button = canvasElement.querySelector<HTMLElement>('[data-testid="probe-button"]');
    if (!button) throw new Error('probe-button missing');
    const bg = await bgWhenMounted(button);
    const [r, g] = parseRgb(bg);
    // Blue.700 (default accent): r=29 < g=78. Violet.700 (Brand A): r=109 > g=40.
    expect(r, `Brand A accent should be violet (r > g); got rgb(${r}, ${g}, _)`).toBeGreaterThan(g);
  },
});

/**
 * Preview decorator publishes the tuple as per-axis `data-<axis>` attributes
 * on both `<html>` and the story wrapper. Upcoming toolbar + CSS-emission
 * work keys on these.
 */
export const PerAxisDataAttrs = meta.story({
  parameters: { swatchbook: { axes: { mode: 'Dark', brand: 'Brand A' } } },
  play: async ({ canvasElement }) => {
    const wrapper = canvasElement.querySelector<HTMLElement>('[data-sb-mode]');
    if (!wrapper) throw new Error('expected story wrapper with data-sb-mode attribute');
    expect(wrapper.getAttribute('data-sb-mode')).toBe('Dark');
    expect(wrapper.getAttribute('data-sb-brand')).toBe('Brand A');
    expect(wrapper.getAttribute('data-sb-theme')).toBe('Dark · Brand A · Normal');
    expect(document.documentElement.getAttribute('data-sb-mode')).toBe('Dark');
    expect(document.documentElement.getAttribute('data-sb-brand')).toBe('Brand A');
  },
});
