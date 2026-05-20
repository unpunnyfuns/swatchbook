import sassPlugin from '@terrazzo/plugin-sass';
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
  default: { mode: 'Light', brand: 'Default', contrast: 'Normal' },
  // Uncomment to suppress the `contrast` axis from this Storybook —
  // the toolbar dropdown disappears, CSS emission drops it from
  // compound selectors, and the Design Tokens panel shows a pinned indicator.
  // disabledAxes: ['contrast'],
  cssVarPrefix: 'sb',
  // Dogfood: wire block chrome to the reference tokens. Without this
  // map, chrome falls back to the hard-coded `light-dark()` defaults
  // in `DEFAULT_CHROME_MAP` — readable, but deaf to our Brand A /
  // contrast axes. Mapping to `color.*` / `typography.*` makes block
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
    bodyFontSize: 'typography.body.font-size',
  },
  // Load plugin-sass so the Token Listing's `names.sass` column populates
  // beyond CSS. Purely for preview — the plugin doesn't emit files through
  // swatchbook; it contributes its identifier-naming logic so
  // `<TokenDetail>`'s Consumer Output renders the Sass identifier alongside
  // the CSS var. plugin-js is intentionally absent: it doesn't register
  // transforms via `getTransforms`, so plugin-token-listing can't look up
  // a `js` format and the listing build fails outright.
  terrazzoPlugins: [sassPlugin({ filename: 'tokens.scss' })],
  listingOptions: {
    platforms: {
      css: { name: '@terrazzo/plugin-css', description: 'CSS custom properties' },
      sass: { name: '@terrazzo/plugin-sass', description: 'Sass variables' },
    },
  },
  presets: [
    {
      name: 'Default Light',
      axes: { mode: 'Light', brand: 'Default', contrast: 'Normal' },
      description: 'Baseline light mode with the stock accent.',
    },
    {
      name: 'Brand A Dark',
      axes: { mode: 'Dark', brand: 'Brand A', contrast: 'Normal' },
      description: 'Dark surfaces paired with the violet Brand A accent.',
    },
    {
      name: 'A11y High Contrast',
      axes: { mode: 'Light', contrast: 'High' },
      description: 'High-contrast borders on the light baseline.',
    },
  ],
});
