import { TokenTable } from '@unpunnyfuns/swatchbook-blocks';
import { expect, waitFor } from 'storybook/test';
import preview from '../../.storybook/preview.tsx';

const meta = preview.meta({
  title: 'Tests/ColorFormat',
  component: TokenTable,
  parameters: {
    swatchbook: { axes: { mode: 'Light', brand: 'Default' } },
  },
});

export default meta;

async function firstColorValueCell(canvasElement: HTMLElement): Promise<HTMLElement> {
  await waitFor(() => {
    const row = canvasElement.querySelector('tbody tr');
    if (!row) throw new Error('no rows yet');
  });
  const row = canvasElement.querySelector('tbody tr');
  if (!row) throw new Error('no rows');
  const cells = row.querySelectorAll<HTMLElement>('td');
  const valueCell = cells[2];
  if (!valueCell) throw new Error('no value cell');
  return valueCell;
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
  render: () => <TokenTable filter='color.sys.*' type='color' />,
  play: async ({ canvasElement }) => {
    const text = await waitForMatch(canvasElement, (t) => /#[0-9a-f]{6}/i.test(t), 'expected hex');
    expect(text).toMatch(/#[0-9a-f]{6}/i);
  },
});

/**
 * `parameters.globals` seeds the format global before render — the cell
 * should render `rgb(R G B)` syntax. This exercises the full pipeline:
 * preview.tsx reads the global, blocks' `useColorFormat` subscribes to
 * the channel, `formatColor` produces the string.
 */
export const RgbFormat = meta.story({
  globals: { swatchbookColorFormat: 'rgb' },
  render: () => <TokenTable filter='color.sys.*' type='color' />,
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
  globals: { swatchbookColorFormat: 'oklch' },
  render: () => <TokenTable filter='color.sys.*' type='color' />,
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
  globals: { swatchbookColorFormat: 'raw' },
  render: () => <TokenTable filter='color.sys.*' type='color' />,
  play: async ({ canvasElement }) => {
    const text = await waitForMatch(
      canvasElement,
      (t) => /"colorSpace"/.test(t),
      'expected raw JSON',
    );
    expect(text).toContain('"colorSpace"');
  },
});
