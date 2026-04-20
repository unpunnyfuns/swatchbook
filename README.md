# Swatchbook

A Storybook addon and MDX blocks for documenting [DTCG](https://www.designtokens.org/) design tokens — parsed via [Terrazzo](https://terrazzo.app/) — with a toolbar that flips **light/dark, brand, contrast, density, or whatever independent dimensions your design system cares about**. Each dimension is a modifier on your DTCG resolver; swatchbook reads them directly, so you don't enumerate every combination as a flat theme ID. (See ["why axes, not themes"](https://unpunnyfuns.github.io/swatchbook/concepts/axes-vs-themes).)

Alongside the switcher, swatchbook ships MDX doc blocks — `TokenNavigator`, `TokenTable`, `ColorPalette`, `TypographyScale`, `TokenDetail`, and more — that render your tokens as browsable reference pages without a bespoke docs site.

**Documentation:** [unpunnyfuns.github.io/swatchbook](https://unpunnyfuns.github.io/swatchbook/) (live Storybook at [`/storybook`](https://unpunnyfuns.github.io/swatchbook/storybook/)).

## Packages

| Package | Purpose |
| --- | --- |
| [`@unpunnyfuns/swatchbook-core`](./packages/core) | Framework-free DTCG loader. Emits CSS variables and TypeScript types. |
| [`@unpunnyfuns/swatchbook-addon`](./packages/addon) | Storybook 10 addon. Toolbar, preview decorator, `useToken()` hook. |
| [`@unpunnyfuns/swatchbook-blocks`](./packages/blocks) | MDX doc blocks. Color swatches, dimension bars, typography samples, composite previews, per-token detail. |

## Install

```sh
npm install -D @unpunnyfuns/swatchbook-addon @unpunnyfuns/swatchbook-core
# plus blocks if you want MDX doc blocks:
npm install -D @unpunnyfuns/swatchbook-blocks
```

Register the addon in `.storybook/main.ts`:

```ts
import { defineMain } from '@storybook/react-vite/node';

export default defineMain({
  stories: ['../src/**/*.stories.@(ts|tsx)', '../src/**/*.mdx'],
  framework: '@storybook/react-vite',
  addons: [
    {
      name: '@unpunnyfuns/swatchbook-addon',
      options: {
        config: {
          resolver: 'tokens/resolver.json',
          cssVarPrefix: 'ds',
        },
      },
    },
  ],
});
```

Opt the preview into the addon's annotations:

```ts
import { definePreview } from '@storybook/react-vite';
import swatchbookAddon from '@unpunnyfuns/swatchbook-addon';

export default definePreview({
  addons: [swatchbookAddon()],
});
```

## First doc page

Create an MDX file under your stories glob. Everything below re-renders against whichever tuple the toolbar has active:

```mdx
import { Meta } from '@storybook/addon-docs/blocks';
import {
  ColorPalette,
  Diagnostics,
  TokenDetail,
  TokenNavigator,
  TokenTable,
} from '@unpunnyfuns/swatchbook-blocks';

<Meta title="Docs/Tokens" />

# Tokens

<Diagnostics />

## Palette
<ColorPalette filter="color.palette.*" />

## Semantic roles
<ColorPalette filter="color.*" />

## Everything
<TokenNavigator initiallyExpanded={0} />

## Inspect a single token
<TokenDetail path="color.accent.bg" />
```

Each block takes filter / scoping props — `filter` (path glob), `type` (DTCG `$type`), `root` (subtree). Type-specific blocks (`<TypographyScale>`, `<DimensionScale>`, `<FontFamilySample>`, `<FontWeightScale>`, `<BorderPreview>`, `<ShadowPreview>`, `<GradientPalette>`, `<MotionPreview>`, `<StrokeStyleSample>`) ship alongside the cross-type ones and render with built-in samples. See the [blocks reference](https://unpunnyfuns.github.io/swatchbook/reference/blocks) for the full prop list per block.

See the [documentation](https://unpunnyfuns.github.io/swatchbook/) for concepts, guides, chrome theming, and the full API reference.

## Credits

Parses DTCG tokens through [Terrazzo](https://terrazzo.app/) by the [Terrazzo team](https://github.com/terrazzoapp) — its parser, resolver evaluation, and alias resolution are the foundation this project builds on.

## Development

pnpm workspaces + Turborepo. Node 24. ESM. `tsdown` for package builds.

```sh
pnpm install
pnpm dev                           # apps/storybook on :6006
pnpm turbo run lint typecheck test build
pnpm turbo run test:storybook
```

We use pnpm internally for workspace orchestration; consumers can install with any package manager.

## License

MIT © [unpunnyfuns](https://github.com/unpunnyfuns).
