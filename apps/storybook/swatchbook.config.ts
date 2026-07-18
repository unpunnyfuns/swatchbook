import sassPlugin from '@terrazzo/plugin-sass';
import swiftPlugin from '@terrazzo/plugin-swift';
import { defineSwatchbookConfig } from '@unpunnyfuns/swatchbook-core';
import { resolverPath } from '@unpunnyfuns/swatchbook-tokens';

/**
 * Shared between `.storybook/main.ts` (consumed via the addon's
 * `configPath` option) and `@unpunnyfuns/swatchbook-mcp` (consumed via
 * its `--config` flag). Keeping the config in a standalone module is
 * the idiomatic path when more than one tool needs to read the same
 * DTCG project shape — the addon preset, the MCP server, a CLI lint,
 * future codegen — all point at this one file.
 */
export default defineSwatchbookConfig({
  resolver: resolverPath,
  default: { mode: 'Light', brand: 'Default', a11y: 'Normal' },
  // Uncomment to suppress the `a11y` axis from this Storybook —
  // the toolbar dropdown disappears, CSS emission drops it from
  // compound selectors, and the Design Tokens panel shows a pinned indicator.
  // disabledAxes: ['a11y'],
  cssVarPrefix: 'sb',
  // Dogfood: wire block chrome to the reference tokens. Without this
  // map, chrome falls back to the hard-coded `light-dark()` defaults
  // in `DEFAULT_CHROME_MAP` — readable, but deaf to our ACME /
  // a11y axes. Mapping to `color.*` / `typography.*` makes block
  // chrome track every toolbar flip.
  chrome: {
    surfaceDefault: 'color.surface.default',
    surfaceMuted: 'color.surface.muted',
    surfaceRaised: 'color.surface.raised',
    textDefault: 'color.text.default',
    textMuted: 'color.text.muted',
    borderDefault: 'color.border.default',
    accentBg: 'color.accent.bg',
    accentFg: 'color.accent.fg',
    bodyFontFamily: 'typography.body.font-family',
  },
  // Demonstrate the consumer-plugin pathway across a cross-section of
  // terrazzo's published platform plugins. Purely for preview — these
  // plugins don't emit files through swatchbook; they contribute their
  // identifier-naming logic via `getTransforms` so `<TokenDetail>`'s
  // Consumer Output can render each platform's identifier alongside
  // the CSS var.
  //
  // Three published plugins are intentionally absent:
  //
  // - `plugin-js`: doesn't register transforms via
  //   `getTransforms`, so plugin-token-listing's lookup fails outright.
  // - `plugin-vanilla-extract`: same architectural shape as
  //   plugin-js — a build-time emitter, not a transform contributor.
  //   plugin-token-listing's lookup for format
  //   `@terrazzo/plugin-vanilla-extract` (and the `vanilla-extract`
  //   fallback) returns nothing.
  // - `plugin-tailwind`: requires a real `template` CSS file
  //   with `@tz` directives plus a `theme` object mapping Tailwind
  //   concepts to token paths. Wiring a meaningful tailwind preview is
  //   its own piece of work and would conflate "demo the listing flow"
  //   with "build a real tailwind pipeline."
  //
  // See issue #987 for the verification trail.
  terrazzoPlugins: [
    sassPlugin({ filename: 'tokens.scss' }),
    swiftPlugin({ catalogName: 'Tokens' }),
  ],
  listingOptions: {
    platforms: {
      css: { name: '@terrazzo/plugin-css', description: 'CSS custom properties' },
      sass: { name: '@terrazzo/plugin-sass', description: 'Sass variables' },
      swift: { name: '@terrazzo/plugin-swift', description: 'Swift constants' },
    },
  },
  presets: [
    {
      name: 'Default Light',
      axes: { mode: 'Light', brand: 'Default', a11y: 'Normal' },
      description: 'Baseline light mode with the stock accent.',
    },
    {
      name: 'ACME Dark',
      axes: { mode: 'Dark', brand: 'ACME', a11y: 'Normal' },
      description: 'Dark surfaces paired with the violet ACME accent.',
    },
    {
      name: 'A11y High Contrast',
      axes: { mode: 'Light', a11y: 'High-contrast' },
      description: 'High-contrast borders on the light baseline.',
    },
  ],
});
