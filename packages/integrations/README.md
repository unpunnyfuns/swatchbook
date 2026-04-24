# swatchbook-integrations

Preview-side adapters that let your Storybook stories use [Tailwind v4](./src/tailwind.ts) or a [CSS-in-JS library](./src/css-in-js.ts) against [swatchbook](https://github.com/unpunnyfuns/swatchbook)'s tokens.

Not a replacement for your production build. Integrations are preview-only — they let `bg-sb-surface-default` or `theme.color.accent.bg` resolve correctly inside Storybook; for production artifacts, run [Terrazzo](https://terrazzo.app/)'s CLI against the same DTCG sources.

## Install

```sh
npm install -D @unpunnyfuns/swatchbook-integrations
```

The `/tailwind` subpath wants Tailwind's Vite plugin too:

```sh
npm install -D tailwindcss @tailwindcss/vite
```

## Usage

```ts title=".storybook/main.ts"
import tailwindIntegration from '@unpunnyfuns/swatchbook-integrations/tailwind';
import cssInJsIntegration from '@unpunnyfuns/swatchbook-integrations/css-in-js';

export default defineMain({
  addons: [
    {
      name: '@unpunnyfuns/swatchbook-addon',
      options: {
        configPath: '../swatchbook.config.ts',
        integrations: [tailwindIntegration(), cssInJsIntegration()],
      },
    },
  ],
});
```

Per-integration wiring details live in the [Integrations guide](https://unpunnyfuns.github.io/swatchbook/guides/integrations/) — Tailwind's Vite plugin setup, the CSS-in-JS `virtual:swatchbook/theme` import, role-map overrides, and how to write your own integration against the `SwatchbookIntegration` contract.

## Boundaries

- ✅ Preview-side use inside Storybook. Stories that style with utility classes or theme accessors pick up the swatchbook toolbar's axis flips via CSS cascade.
- ❌ No MUI / Vuetify / Bootstrap SCSS factories. Those need resolved values per named theme — run Terrazzo's CLI with `@terrazzo/plugin-js` for that case.

## Documentation

[unpunnyfuns.github.io/swatchbook](https://unpunnyfuns.github.io/swatchbook/) — concepts, guides, and full API reference.
