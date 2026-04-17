import {
  BorderPreview,
  ColorPalette,
  DimensionScale,
  FontFamilySample,
  FontWeightScale,
  MotionPreview,
  ShadowPreview,
  StrokeStyleSample,
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
 * `DimensionScale` must render one bar per dimension token, and each bar's
 * rendered width must reflect the underlying cssVar (i.e. non-zero for
 * tokens with a non-zero value — space.sys.md is 12px).
 */
export const DimensionScaleRenders = meta.story({
  render: () => <DimensionScale filter='space.sys.*' />,
  play: async ({ canvasElement }) => {
    await waitForContent(canvasElement, 'div[aria-hidden="true"]');
    const bars = [...canvasElement.querySelectorAll<HTMLElement>('div[aria-hidden="true"]')];
    expect(bars.length, 'DimensionScale must render at least one bar').toBeGreaterThan(0);
    const nonZeroWidths = bars.map((bar) => bar.getBoundingClientRect().width).filter((w) => w > 0);
    expect(
      nonZeroWidths.length,
      'at least one bar must resolve to a non-zero width',
    ).toBeGreaterThan(0);
  },
});

/**
 * `ShadowPreview` must render a sample with a non-empty `box-shadow`
 * computed style for at least one shadow token.
 */
export const ShadowPreviewRenders = meta.story({
  render: () => <ShadowPreview filter='shadow.sys.*' />,
  play: async ({ canvasElement }) => {
    await waitForContent(canvasElement, 'div[aria-hidden="true"]');
    const samples = [...canvasElement.querySelectorAll<HTMLElement>('div[aria-hidden="true"]')];
    const withShadow = samples.filter((el) => {
      const bs = getComputedStyle(el).boxShadow;
      return bs && bs !== 'none';
    });
    expect(
      withShadow.length,
      'at least one sample must resolve to a non-none box-shadow',
    ).toBeGreaterThan(0);
  },
});

/**
 * `BorderPreview` must render a sample whose computed `border-style` is not
 * `none` for at least one border token.
 */
export const BorderPreviewRenders = meta.story({
  render: () => <BorderPreview filter='border.sys.*' />,
  play: async ({ canvasElement }) => {
    await waitForContent(canvasElement, 'div[aria-hidden="true"]');
    const samples = [...canvasElement.querySelectorAll<HTMLElement>('div[aria-hidden="true"]')];
    const withBorder = samples.filter((el) => {
      const style = getComputedStyle(el).borderTopStyle;
      return style && style !== 'none';
    });
    expect(
      withBorder.length,
      'at least one sample must resolve to a non-none border-style',
    ).toBeGreaterThan(0);
  },
});

/**
 * `MotionPreview` must render an animated element whose computed
 * `transition-duration` reflects the token (or a default when reduced motion
 * is on — we don't assert behavior there, just that the block renders).
 */
export const MotionPreviewRenders = meta.story({
  render: () => <MotionPreview filter='motion.sys.*' />,
  play: async ({ canvasElement }) => {
    await waitForContent(canvasElement, 'div[aria-hidden="true"]');
    const balls = [...canvasElement.querySelectorAll<HTMLElement>('div[aria-hidden="true"]')];
    // Find the one inside a track (has transition-duration set). Skip empty
    // cases from reduced-motion mode.
    const animated = balls.find((el) => {
      const td = getComputedStyle(el).transitionDuration;
      return td && td !== '0s';
    });
    // Under reduced-motion, no ball animates. That's still valid; assert
    // the block rendered at all.
    const captionText = canvasElement.textContent ?? '';
    expect(captionText).toMatch(/motion token/i);
    if (animated) {
      const duration = getComputedStyle(animated).transitionDuration;
      expect(duration).not.toBe('0s');
    }
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
 * `TokenDetail` for a composite token type renders a live preview of the
 * composite — typography as a pangram sample, shadow/border as a card with
 * the effect applied, transition as an animated ball.
 */
export const TokenDetailTypographyComposite = meta.story({
  render: () => <TokenDetail path='typography.sys.heading' />,
  play: async ({ canvasElement }) => {
    await waitForContent(canvasElement, 'h3');
    const sample = [...canvasElement.querySelectorAll<HTMLElement>('div')].find((el) =>
      el.textContent?.startsWith('Sphinx of black quartz'),
    );
    expect(sample, 'typography composite must render a pangram sample').toBeTruthy();
    if (sample) {
      expect(
        getComputedStyle(sample).fontFamily,
        'sample must resolve a concrete font-family',
      ).not.toBe('');
    }
  },
});

export const TokenDetailShadowComposite = meta.story({
  render: () => <TokenDetail path='shadow.sys.md' />,
  play: async ({ canvasElement }) => {
    await waitForContent(canvasElement, 'h3');
    const samples = [...canvasElement.querySelectorAll<HTMLElement>('div[aria-hidden="true"]')];
    const withShadow = samples.filter((el) => {
      const bs = getComputedStyle(el).boxShadow;
      return bs && bs !== 'none';
    });
    expect(
      withShadow.length,
      'shadow composite must render a sample with non-none box-shadow',
    ).toBeGreaterThan(0);
  },
});

/**
 * `StrokeStyleSample` must render one row per `strokeStyle` token. Rows
 * with a string value (`solid`, `dashed`, `dotted`, `double`) must resolve
 * to a non-`none` `border-top-style`; object-form tokens render a textual
 * fallback, which is acceptable.
 */
export const StrokeStyleSampleRenders = meta.story({
  render: () => <StrokeStyleSample filter='stroke.ref.style.*' />,
  play: async ({ canvasElement }) => {
    await waitForContent(canvasElement, 'section, div');
    const lines = [...canvasElement.querySelectorAll<HTMLElement>('div[aria-hidden="true"]')];
    const styledLines = lines.filter((el) => {
      const s = getComputedStyle(el).borderTopStyle;
      return s && s !== 'none';
    });
    expect(
      styledLines.length,
      'at least one strokeStyle row must resolve to a non-none border-style',
    ).toBeGreaterThan(0);
    const text = canvasElement.textContent ?? '';
    expect(text, 'block must mention the object-form fallback').toMatch(/Object-form/);
  },
});

/**
 * `FontFamilySample` must render one row per fontFamily token, and each
 * sample's computed `font-family` must resolve to a non-empty stack.
 */
export const FontFamilySampleRenders = meta.story({
  render: () => <FontFamilySample filter='font.ref.family.*' />,
  play: async ({ canvasElement }) => {
    await waitForContent(canvasElement, 'section, div');
    const paths = [...canvasElement.querySelectorAll('span')].filter((el) =>
      el.textContent?.startsWith('font.ref.family.'),
    );
    expect(paths.length, 'at least one fontFamily row must render').toBeGreaterThan(0);
    const samples = [...canvasElement.querySelectorAll<HTMLElement>('div')].filter((el) =>
      el.textContent?.includes('quick brown fox'),
    );
    const resolved = samples.filter((el) => getComputedStyle(el).fontFamily !== '');
    expect(
      resolved.length,
      'at least one sample must resolve to a non-empty font-family',
    ).toBeGreaterThan(0);
  },
});

/**
 * `FontWeightScale` must render one row per fontWeight token with the
 * computed `font-weight` reflecting each token's value.
 */
export const FontWeightScaleRenders = meta.story({
  render: () => <FontWeightScale filter='font.ref.weight.*' />,
  play: async ({ canvasElement }) => {
    await waitForContent(canvasElement, 'section, div');
    const samples = [...canvasElement.querySelectorAll<HTMLElement>('div')].filter(
      (el) => el.textContent === 'Aa',
    );
    expect(samples.length, 'at least one fontWeight sample must render').toBeGreaterThan(0);
    const weights = samples.map((el) => Number.parseInt(getComputedStyle(el).fontWeight, 10));
    const numeric = weights.filter((w) => Number.isFinite(w));
    expect(numeric.length).toBeGreaterThan(0);
    const max = Math.max(...numeric);
    const min = Math.min(...numeric);
    expect(max, 'scale must include a weight heavier than the lightest').toBeGreaterThan(min);
  },
});

/**
 * `TokenDetail` for a fontFamily primitive must render sample text whose
 * computed `font-family` reflects the token's stack.
 */
export const TokenDetailFontFamilyPrimitive = meta.story({
  render: () => <TokenDetail path='font.ref.family.sans' />,
  play: async ({ canvasElement }) => {
    await waitForContent(canvasElement, 'h3');
    const sample = [...canvasElement.querySelectorAll<HTMLElement>('div')].find((el) =>
      el.textContent?.startsWith('Sphinx of black quartz'),
    );
    expect(sample, 'fontFamily primitive must render a pangram sample').toBeTruthy();
    if (sample) {
      expect(getComputedStyle(sample).fontFamily).not.toBe('');
    }
  },
});

/**
 * `TokenDetail` for a fontWeight primitive must render sample text whose
 * computed `font-weight` matches the token value.
 */
export const TokenDetailFontWeightPrimitive = meta.story({
  render: () => <TokenDetail path='font.ref.weight.bold' />,
  play: async ({ canvasElement }) => {
    await waitForContent(canvasElement, 'h3');
    const sample = [...canvasElement.querySelectorAll<HTMLElement>('div')].find(
      (el) => el.textContent === 'Aa',
    );
    expect(sample, 'fontWeight primitive must render a sample').toBeTruthy();
    if (sample) {
      const w = Number.parseInt(getComputedStyle(sample).fontWeight, 10);
      expect(w, 'bold sample must compute to weight ≥ 600').toBeGreaterThanOrEqual(600);
    }
  },
});

/**
 * `TokenDetail` for a dimension primitive must render a bar whose computed
 * width matches the token's cssVar.
 */
export const TokenDetailDimensionPrimitive = meta.story({
  render: () => <TokenDetail path='space.sys.md' />,
  play: async ({ canvasElement }) => {
    await waitForContent(canvasElement, 'h3');
    const bars = [...canvasElement.querySelectorAll<HTMLElement>('div[aria-hidden="true"]')];
    const sized = bars.find((el) => el.getBoundingClientRect().width > 0);
    expect(sized, 'dimension primitive must render a bar with non-zero width').toBeTruthy();
  },
});

/**
 * `TokenDetail` for a duration primitive must render an animating ball whose
 * computed `transition-duration` reflects the token. Under reduced motion
 * the suppressed-notice is acceptable.
 */
export const TokenDetailDurationPrimitive = meta.story({
  render: () => <TokenDetail path='duration.ref.slow' />,
  play: async ({ canvasElement }) => {
    await waitForContent(canvasElement, 'h3');
    const balls = [...canvasElement.querySelectorAll<HTMLElement>('div[aria-hidden="true"]')];
    const animated = balls.find((el) => {
      const td = getComputedStyle(el).transitionDuration;
      return td && td !== '0s';
    });
    const text = canvasElement.textContent ?? '';
    if (!animated) {
      expect(text).toMatch(/Animation suppressed/);
    } else {
      expect(getComputedStyle(animated).transitionDuration).not.toBe('0s');
    }
  },
});

/**
 * `TokenDetail` for a cubicBezier primitive must render an animating ball
 * whose computed `transition-timing-function` reflects the easing curve.
 */
export const TokenDetailCubicBezierPrimitive = meta.story({
  render: () => <TokenDetail path='easing.ref.standard' />,
  play: async ({ canvasElement }) => {
    await waitForContent(canvasElement, 'h3');
    const balls = [...canvasElement.querySelectorAll<HTMLElement>('div[aria-hidden="true"]')];
    const animated = balls.find((el) => {
      const td = getComputedStyle(el).transitionDuration;
      return td && td !== '0s';
    });
    const text = canvasElement.textContent ?? '';
    if (!animated) {
      expect(text).toMatch(/Animation suppressed/);
    } else {
      expect(getComputedStyle(animated).transitionTimingFunction).toContain('cubic-bezier');
    }
  },
});

/**
 * `TokenDetail` for a heavily-aliased primitive must render the "Aliased by"
 * section listing at least one transitive descendant — that's the core
 * promise of backward alias traversal.
 */
export const TokenDetailAliasedBy = meta.story({
  render: () => <TokenDetail path='color.ref.neutral.0' />,
  play: async ({ canvasElement }) => {
    await waitForContent(canvasElement, 'h3');
    const body = canvasElement.textContent ?? '';
    expect(body, 'must render Aliased by section').toContain('Aliased by');
    const nodes = [...canvasElement.querySelectorAll('li span')].map((el) =>
      el.textContent?.trim(),
    );
    const hasSys = nodes.some((n) => n?.startsWith('color.sys.'));
    expect(hasSys, 'tree must include at least one sys descendant').toBe(true);
    const hasCmp = nodes.some((n) => n?.startsWith('cmp.'));
    expect(hasCmp, 'tree must include at least one transitive cmp descendant').toBe(true);
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
