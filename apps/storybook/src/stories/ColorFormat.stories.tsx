import { TokenTable } from '@unpunnyfuns/swatchbook-blocks';
import { expect, waitFor } from 'storybook/test';
import preview from '#storybook/preview.tsx';

const meta = preview.meta({
  title: 'Tests/ColorFormat',
  tags: ['!manifest', '!dev'],
  component: TokenTable,
  // Test harness for the color-format pipeline: every story renders the
  // full color.** TokenTable purely to assert the value-cell output. axe
  // (a11y) on that table is already covered by Blocks/TokenTable's
  // SysColors story; skip the redundant seconds-long pass here (#1212).
  parameters: {
    swatchbook: { axes: { mode: 'Light', brand: 'Default' } },
    a11y: { test: 'off' },
  },
});

export default meta;

async function firstColorValueCell(canvasElement: HTMLElement): Promise<HTMLElement> {
  await waitFor(() => {
    const value = canvasElement.querySelector('[data-testid="token-table-value"]');
    if (!value) throw new Error('no rows yet');
  });
  const value = canvasElement.querySelector<HTMLElement>('[data-testid="token-table-value"]');
  if (!value) throw new Error('no value span');
  return value;
}

async function waitForMatch(
  canvasElement: HTMLElement,
  predicate: (text: string) => boolean,
  label: string,
): Promise<string> {
  let seen = '';
  await waitFor(async () => {
    const cell = await firstColorValueCell(canvasElement);
    seen = cell.textContent ?? '';
    if (!predicate(seen)) throw new Error(`${label}: got "${seen}"`);
  });
  return seen;
}

/**
 * Default format is `hex`. The first rendered color-token row's value cell
 * should display a `#rrggbb` string.
 */
export const DefaultHex = meta.story({
  render: () => <TokenTable filter="color.**" type="color" />,
  play: async ({ canvasElement }) => {
    const text = await waitForMatch(canvasElement, (t) => /#[0-9a-f]{6}/i.test(t), 'expected hex');
    expect(text).toMatch(/#[0-9a-f]{6}/i);
  },
});

/**
 * A block's `colorFormat` prop overrides the project default. The addon
 * toolbar no longer exposes a color-format control — blocks start from
 * `Config.defaultColorFormat` and a per-block `colorFormat` prop wins over
 * it — so the value cell should render `rgb(R G B)` syntax.
 */
export const RgbFormat = meta.story({
  render: () => <TokenTable filter="color.**" type="color" colorFormat="rgb" />,
  play: async ({ canvasElement }) => {
    const text = await waitForMatch(
      canvasElement,
      (t) => t.trim().startsWith('rgb('),
      'expected rgb()',
    );
    expect(text.trim()).toMatch(/^rgb\(/);
  },
});

export const OklchFormat = meta.story({
  render: () => <TokenTable filter="color.**" type="color" colorFormat="oklch" />,
  play: async ({ canvasElement }) => {
    const text = await waitForMatch(
      canvasElement,
      (t) => t.trim().startsWith('oklch('),
      'expected oklch()',
    );
    expect(text.trim()).toMatch(/^oklch\(/);
  },
});

export const RawFormat = meta.story({
  render: () => <TokenTable filter="color.**" type="color" colorFormat="raw" />,
  play: async ({ canvasElement }) => {
    const text = await waitForMatch(
      canvasElement,
      (t) => /"colorSpace"/.test(t),
      'expected raw JSON',
    );
    expect(text).toContain('"colorSpace"');
  },
});
