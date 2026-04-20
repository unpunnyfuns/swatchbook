import { useToken } from '@unpunnyfuns/swatchbook-addon/hooks';
import { expect, waitFor } from 'storybook/test';
import preview from '../../.storybook/preview.tsx';

function Probe() {
  const surface = useToken('color.sys.surface.default');
  const text = useToken('color.sys.text.default');
  return (
    <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 13, padding: 12 }}>
      <div>
        <strong>surface.default</strong>
      </div>
      <div data-testid="surface-value">{JSON.stringify(surface.value)}</div>
      <div data-testid="surface-cssvar">{surface.cssVar}</div>
      <div style={{ marginTop: 12 }}>
        <strong>text.default</strong>
      </div>
      <div data-testid="text-value">{JSON.stringify(text.value)}</div>
      <div data-testid="text-cssvar">{text.cssVar}</div>
    </div>
  );
}

const meta = preview.meta({
  title: 'Tests/UseTokenUpdates',
  component: Probe,
});

export default meta;

interface Srgb {
  colorSpace: 'srgb';
  components: [number, number, number];
  alpha?: number;
}

function parseSrgb(text: string): Srgb {
  const parsed = JSON.parse(text) as unknown;
  if (!parsed || typeof parsed !== 'object') throw new Error(`non-object value: ${text}`);
  const v = parsed as Srgb;
  if (v.colorSpace !== 'srgb' || !Array.isArray(v.components) || v.components.length !== 3) {
    throw new Error(`unexpected value shape: ${text}`);
  }
  return v;
}

async function textContent(root: Element, testId: string): Promise<string> {
  await waitFor(() => {
    const el = root.querySelector<HTMLElement>(`[data-testid="${testId}"]`);
    if (!el || !el.textContent) throw new Error(`${testId} not rendered`);
  });
  const el = root.querySelector<HTMLElement>(`[data-testid="${testId}"]`);
  return el?.textContent ?? '';
}

/**
 * Under Light, `color.sys.surface.default` aliases into `neutral.0` (white)
 * and `color.sys.text.default` into `neutral.900` (near-black). The cssVar
 * strings are theme-invariant; only the resolved `value` should shift.
 */
export const Light = meta.story({
  parameters: { swatchbook: { axes: { mode: 'Light', brand: 'Default' } } },
  play: async ({ canvasElement }) => {
    const surface = parseSrgb(await textContent(canvasElement, 'surface-value'));
    const text = parseSrgb(await textContent(canvasElement, 'text-value'));

    expect(
      Math.min(...surface.components),
      `Light surface components should all be high (near 1); got ${surface.components.join(', ')}`,
    ).toBeGreaterThan(0.9);

    expect(
      Math.max(...text.components),
      `Light text components should all be low (near 0); got ${text.components.join(', ')}`,
    ).toBeLessThan(0.3);

    const cssVar = await textContent(canvasElement, 'surface-cssvar');
    expect(cssVar).toBe('var(--sb-color-sys-surface-default)');
  },
});

/**
 * Under Dark, `color.sys.surface.default` and `color.sys.text.default` flip —
 * the same `useToken()` calls now resolve against `neutral.900` and
 * `neutral.50` respectively. This story proves `useToken` is reactive to
 * the active theme (via `parameters.swatchbook.theme` here — same channel
 * the toolbar uses at runtime).
 */
export const Dark = meta.story({
  parameters: { swatchbook: { axes: { mode: 'Dark', brand: 'Default' } } },
  play: async ({ canvasElement }) => {
    const surface = parseSrgb(await textContent(canvasElement, 'surface-value'));
    const text = parseSrgb(await textContent(canvasElement, 'text-value'));

    expect(
      Math.max(...surface.components),
      `Dark surface components should all be low (near 0); got ${surface.components.join(', ')}`,
    ).toBeLessThan(0.3);

    expect(
      Math.min(...text.components),
      `Dark text components should all be high (near 1); got ${text.components.join(', ')}`,
    ).toBeGreaterThan(0.9);

    const cssVar = await textContent(canvasElement, 'surface-cssvar');
    expect(cssVar, 'cssVar must be theme-invariant').toBe('var(--sb-color-sys-surface-default)');
  },
});
