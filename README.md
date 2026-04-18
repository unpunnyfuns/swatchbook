# Swatchbook

A Storybook addon and supporting packages for documenting [DTCG](https://www.designtokens.org/) design tokens — parsed via [Terrazzo](https://terrazzo.app/) — inside your Storybook.

**Documentation:** [unpunnyfuns.github.io/swatchbook](https://unpunnyfuns.github.io/swatchbook/) (live Storybook at [`/storybook`](https://unpunnyfuns.github.io/swatchbook/storybook/)).

## Packages

| Package | Purpose |
| --- | --- |
| [`@unpunnyfuns/swatchbook-core`](./packages/core) | Framework-free DTCG loader. Emits CSS variables and TypeScript types. |
| [`@unpunnyfuns/swatchbook-addon`](./packages/addon) | Storybook 10 addon. Toolbar, Design Tokens panel, preview decorator, `useToken()` hook. |
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

See the [documentation](https://unpunnyfuns.github.io/swatchbook/) for concepts, guides, and the full API reference.

## Credits

Parses DTCG tokens through [Terrazzo](https://terrazzo.app/) by [Drew Powers](https://github.com/drwpow) — its parser, resolver evaluation, and alias resolution are the foundation this project builds on.

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
