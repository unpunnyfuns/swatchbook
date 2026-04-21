# swatchbook

A Storybook addon and MDX blocks for documenting [DTCG](https://www.designtokens.org/) design tokens.

Two things in one:

- **Doc blocks** — `TokenNavigator`, `TokenTable`, `ColorPalette`, `TypographyScale`, `TokenDetail`, and more. Drop them into MDX pages and your token reference writes itself.
- **A multi-axis theme switcher** — flip dark mode, brand, contrast, density, whatever dimensions your design system has, from one toolbar button. Each dimension is a DTCG resolver modifier; each becomes a dropdown inside a single popover. (See [*why axes, not themes*](https://unpunnyfuns.github.io/swatchbook/concepts/axes-vs-themes).)

**Documentation:** [unpunnyfuns.github.io/swatchbook](https://unpunnyfuns.github.io/swatchbook/) · **Live Storybook:** [/storybook](https://unpunnyfuns.github.io/swatchbook/storybook/)

## Packages

| Package | Purpose |
| --- | --- |
| [`@unpunnyfuns/swatchbook-addon`](./packages/addon) | Storybook 10 addon. Toolbar, preview decorator, `useToken()`. Re-exports the full blocks + switcher React surface so consumers can install just this one. |
| [`@unpunnyfuns/swatchbook-core`](./packages/core) | Framework-free DTCG loader. Emits CSS variables and TypeScript types. |
| [`@unpunnyfuns/swatchbook-blocks`](./packages/blocks) | MDX doc blocks. Color swatches, dimension bars, typography samples, composite previews, per-token detail. |
| [`@unpunnyfuns/swatchbook-switcher`](./packages/switcher) | Framework-agnostic axis / preset popover UI. Used by the addon toolbar and by the docs-site navbar. |
| [`@unpunnyfuns/swatchbook-mcp`](./packages/mcp) | Model Context Protocol server exposing a DTCG project's tokens, axes, and diagnostics to AI agents. Runs without Storybook. |

## Install

```sh
npm install -D @unpunnyfuns/swatchbook-addon
```

One package pulls the whole React surface — toolbar, preview decorator, MDX doc blocks, `ThemeSwitcher`, `useToken()`. The sibling packages (`-core`, `-blocks`, `-switcher`) come along transitively and stay independently installable for slice-only consumers (e.g. a Docusaurus site that only renders the switcher).

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
} from '@unpunnyfuns/swatchbook-addon';

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
