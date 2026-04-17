import {
  ColorPalette,
  TokenDetail,
  TokenTable,
  TypographyScale,
} from '@unpunnyfuns/swatchbook-blocks';
import { diagnostics } from 'virtual:swatchbook/tokens';
import { expect, waitFor } from 'storybook/test';
import preview from '../../.storybook/preview.tsx';

function DiagnosticsProbe() {
  const errors = diagnostics.filter((d) => d.severity === 'error').length;
  const warns = diagnostics.filter((d) => d.severity === 'warn').length;
  return (
    <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 13, padding: 12 }}>
      <div data-testid='diag-total'>{diagnostics.length}</div>
      <div data-testid='diag-errors'>{errors}</div>
      <div data-testid='diag-warns'>{warns}</div>
    </div>
  );
}

const meta = preview.meta({
  title: 'Tests/BlockAssertions',
  component: DiagnosticsProbe,
});

export default meta;

async function waitForContent(root: ParentNode, selector: string): Promise<Element> {
  await waitFor(() => {
    const el = root.querySelector(selector);
    if (!el) throw new Error(`${selector} not found`);
  });
  const el = root.querySelector(selector);
  if (!el) throw new Error(`${selector} not found after wait`);
  return el;
}

/**
 * `ColorPalette` must render at least one group section and at least one
 * swatch card whose background resolves to a non-transparent CSS value.
 */
export const ColorPaletteRenders = meta.story({
  render: () => <ColorPalette filter='color.sys.surface.*' groupBy={3} />,
  play: async ({ canvasElement }) => {
    const section = await waitForContent(canvasElement, 'section');
    const swatch = section.querySelector<HTMLElement>('[aria-hidden="true"]');
    expect(swatch, 'palette must render at least one swatch element').not.toBeNull();
    if (!swatch) return;
    const bg = getComputedStyle(swatch).backgroundColor;
    expect(bg, 'swatch must resolve to a concrete color').not.toBe('rgba(0, 0, 0, 0)');
    expect(bg).not.toBe('');
  },
});

/**
 * `TokenTable` must render the expected headers and at least one data row.
 */
export const TokenTableRenders = meta.story({
  render: () => <TokenTable filter='color.sys.*' type='color' />,
  play: async ({ canvasElement }) => {
    await waitForContent(canvasElement, 'tbody tr');
    const headerTexts = [...canvasElement.querySelectorAll('thead th')].map((th) =>
      th.textContent?.trim(),
    );
    expect(headerTexts).toEqual(expect.arrayContaining(['Path', 'Type', 'Value']));
    const rows = canvasElement.querySelectorAll('tbody tr');
    expect(rows.length, 'table must render at least one row').toBeGreaterThan(0);
  },
});

/**
 * `TypographyScale` must render one row per typography token with the
 * sample text visible.
 */
export const TypographyScaleRenders = meta.story({
  render: () => <TypographyScale filter='typography' sample='Sphinx of black quartz' />,
  play: async ({ canvasElement }) => {
    await waitForContent(canvasElement, 'section, [role="table"], div');
    const samples = [...canvasElement.querySelectorAll('div')].filter((el) =>
      el.textContent?.includes('Sphinx of black quartz'),
    );
    expect(samples.length, 'at least one typography sample must render').toBeGreaterThan(0);
  },
});

/**
 * `TokenDetail` must render the heading, cssVar reference, resolved value
 * section, and alias chain for a known path.
 */
export const TokenDetailRenders = meta.story({
  render: () => <TokenDetail path='cmp.button.bg' />,
  play: async ({ canvasElement }) => {
    const heading = await waitForContent(canvasElement, 'h3');
    expect(heading.textContent).toBe('cmp.button.bg');

    const bodyText = canvasElement.textContent ?? '';
    expect(bodyText, 'must render Resolved value section').toContain('Resolved value');
    expect(bodyText, 'must render Alias chain section').toContain('Alias chain');
    expect(bodyText, 'must render the cssVar reference').toContain('var(--sb-cmp-button-bg)');
  },
});

/**
 * `TokenDetail` for a missing path must render its empty state rather than
 * throwing.
 */
export const TokenDetailMissing = meta.story({
  render: () => <TokenDetail path='color.does.not.exist' />,
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      const text = canvasElement.textContent ?? '';
      if (!text) throw new Error('TokenDetail empty');
    });
    const text = canvasElement.textContent ?? '';
    expect(text.toLowerCase()).toMatch(/not found|missing|no such/);
  },
});

/**
 * The reference fixture is expected to load cleanly — zero errors, zero
 * warnings from the addon's project load. This story pins that baseline;
 * if a token change introduces a diagnostic, this test fails and pokes
 * the author to look at the panel.
 *
 * Full "seed an invalid token → fix it → recover" scenario requires HMR
 * into a writable fixture, which is out of scope for play-fn tests
 * running against the build-time project. Tracked separately if needed.
 */
export const DiagnosticsClean = meta.story({
  play: async ({ canvasElement }) => {
    const errors = await waitForContent(canvasElement, '[data-testid="diag-errors"]');
    const warns = await waitForContent(canvasElement, '[data-testid="diag-warns"]');
    expect(errors.textContent, 'reference fixture must load with zero errors').toBe('0');
    expect(warns.textContent, 'reference fixture must load with zero warnings').toBe('0');
  },
});
