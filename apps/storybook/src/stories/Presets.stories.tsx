import { expect, waitFor } from 'storybook/test';
import preview from '../../.storybook/preview.tsx';
import { Button } from '../components/Button.tsx';
import { Card } from '../components/Card.tsx';

function PresetProbe() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 12 }}>
      <Card data-testid="preset-card" title="Preset card">
        Flips with the active preset tuple.
      </Card>
      <Button data-testid="preset-button" variant="primary">
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

async function findWrapper(canvasElement: HTMLElement): Promise<HTMLElement> {
  return waitFor(() => {
    const el = canvasElement.querySelector<HTMLElement>('[data-sb-mode]');
    if (!el) throw new Error('story wrapper missing');
    return el;
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
    const wrapper = await findWrapper(canvasElement);
    await waitForAttr(wrapper, 'data-sb-mode', 'Light');
    await waitForAttr(wrapper, 'data-sb-brand', 'Default');
    expect(wrapper.getAttribute('data-sb-theme')).toBe('Light · Default · Normal');
  },
});

/**
 * `Brand A Dark` preset — full-tuple match. Per-axis `data-sb-*` attributes
 * should reflect the preset exactly.
 */
export const BrandADarkPreset = meta.story({
  parameters: {
    swatchbook: { axes: { mode: 'Dark', brand: 'Brand A' } },
  },
  play: async ({ canvasElement }) => {
    const wrapper = await findWrapper(canvasElement);
    await waitForAttr(wrapper, 'data-sb-mode', 'Dark');
    await waitForAttr(wrapper, 'data-sb-brand', 'Brand A');
    expect(wrapper.getAttribute('data-sb-theme')).toBe('Dark · Brand A · Normal');
  },
});
