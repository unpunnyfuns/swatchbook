import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import {
  ConsumerOutput,
  type ProjectSnapshot,
  SwatchbookProvider,
  type VirtualTokenListingShape,
} from '#/index.ts';

function makeSnapshot(
  listing?: Readonly<Record<string, VirtualTokenListingShape>>,
): ProjectSnapshot {
  return {
    axes: [{ name: 'theme', contexts: ['Light'], default: 'Light', source: 'synthetic' }],
    disabledAxes: [],
    presets: [],
    themes: [{ name: 'Light', input: { theme: 'Light' }, sources: [] }],
    themesResolved: {
      Light: {
        'color.accent.bg': { $type: 'color', $value: { hex: '#3b82f6' } },
      },
    },
    activeTheme: 'Light',
    activeAxes: { theme: 'Light' },
    cssVarPrefix: 'sb',
    diagnostics: [],
    css: '',
    ...(listing !== undefined && { listing }),
  };
}

describe('ConsumerOutput', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders Path + CSS rows when no listing is present', () => {
    render(
      <SwatchbookProvider value={makeSnapshot()}>
        <ConsumerOutput path="color.accent.bg" />
      </SwatchbookProvider>,
    );

    expect(screen.getByTestId('consumer-output-path').textContent).toBe('color.accent.bg');
    expect(screen.getByTestId('consumer-output-css').textContent).toBe('var(--sb-color-accent-bg)');
    expect(screen.queryByTestId('consumer-output-swift')).toBeNull();
  });

  it('adds one row per non-css platform from the listing', () => {
    const listing = {
      'color.accent.bg': {
        names: {
          css: '--sb-color-accent-bg',
          swift: 'Color.accentBg',
          android: '@color/accent_bg',
          sass: '$accent-bg',
        },
      },
    } satisfies Record<string, VirtualTokenListingShape>;

    render(
      <SwatchbookProvider value={makeSnapshot(listing)}>
        <ConsumerOutput path="color.accent.bg" />
      </SwatchbookProvider>,
    );

    expect(screen.getByTestId('consumer-output-swift').textContent).toBe('Color.accentBg');
    expect(screen.getByTestId('consumer-output-android').textContent).toBe('@color/accent_bg');
    expect(screen.getByTestId('consumer-output-sass').textContent).toBe('$accent-bg');
  });

  it('sorts platform rows alphabetically for a stable order across renders', () => {
    const listing = {
      'color.accent.bg': {
        names: {
          css: '--sb-color-accent-bg',
          swift: 'Color.accentBg',
          android: '@color/accent_bg',
          sass: '$accent-bg',
          js: 'colorAccentBg',
        },
      },
    } satisfies Record<string, VirtualTokenListingShape>;

    render(
      <SwatchbookProvider value={makeSnapshot(listing)}>
        <ConsumerOutput path="color.accent.bg" />
      </SwatchbookProvider>,
    );

    const labels = screen.getAllByText(/^(Android|Js|Sass|Swift)$/).map((el) => el.textContent);
    expect(labels).toEqual(['Android', 'Js', 'Sass', 'Swift']);
  });

  it('skips platforms whose listing value is empty', () => {
    const listing = {
      'color.accent.bg': {
        names: {
          css: '--sb-color-accent-bg',
          swift: '',
        },
      },
    } satisfies Record<string, VirtualTokenListingShape>;

    render(
      <SwatchbookProvider value={makeSnapshot(listing)}>
        <ConsumerOutput path="color.accent.bg" />
      </SwatchbookProvider>,
    );

    expect(screen.queryByTestId('consumer-output-swift')).toBeNull();
  });
});
