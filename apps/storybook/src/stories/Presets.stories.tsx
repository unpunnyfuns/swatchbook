import { expect, waitFor } from 'storybook/test';
import preview from '../../.storybook/preview.tsx';
import { Button } from '../components/Button.tsx';
import { Card } from '../components/Card.tsx';

function PresetProbe() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 12 }}>
      <Card data-testid='preset-card' title='Preset card'>
        Flips with the active preset tuple.
      </Card>
      <Button data-testid='preset-button' variant='primary'>
        Accent follows Brand A.
      </Button>
    </div>
  );
}

const meta = preview.meta({
  title: 'Tests/Presets',
  component: PresetProbe,
});

export default meta;

async function waitForAttr(el: Element, attr: string, expected: string): Promise<void> {
  await waitFor(() => {
    const actual = el.getAttribute(attr);
    if (actual !== expected) throw new Error(`expected ${attr}=${expected}, got ${actual}`);
  });
}

/**
 * Preset config in `swatchbook.config.ts`: `Default Light` →
 * `{ mode: 'Light', brand: 'Default' }`. The preview decorator
 * writes the tuple to both `<html>` and the story wrapper.
 */
export const DefaultLightPreset = meta.story({
  parameters: {
    swatchbook: { axes: { mode: 'Light', brand: 'Default' } },
  },
  play: async ({ canvasElement }) => {
    const wrapper = canvasElement.querySelector<HTMLElement>('[data-mode]');
    if (!wrapper) throw new Error('story wrapper missing');
    await waitForAttr(wrapper, 'data-mode', 'Light');
    await waitForAttr(wrapper, 'data-brand', 'Default');
    expect(wrapper.getAttribute('data-theme')).toBe('Light · Default');
  },
});

/**
 * `Brand A Dark` preset — full-tuple match. Per-axis `data-*` attributes
 * should reflect the preset exactly.
 */
export const BrandADarkPreset = meta.story({
  parameters: {
    swatchbook: { axes: { mode: 'Dark', brand: 'Brand A' } },
  },
  play: async ({ canvasElement }) => {
    const wrapper = canvasElement.querySelector<HTMLElement>('[data-mode]');
    if (!wrapper) throw new Error('story wrapper missing');
    await waitForAttr(wrapper, 'data-mode', 'Dark');
    await waitForAttr(wrapper, 'data-brand', 'Brand A');
    expect(wrapper.getAttribute('data-theme')).toBe('Dark · Brand A');
  },
});
