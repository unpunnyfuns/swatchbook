# swatchbook

A Storybook addon and MDX doc blocks for visualising [DTCG design tokens](https://www.designtokens.org/TR/2025.10/).

Built on [Terrazzo](https://terrazzo.app/)'s parser. Your production build runs Terrazzo's CLI against the same DTCG source; swatchbook reads it too, inside Storybook.

If your stories already style with CSS variables, they pick up the toolbar's axis flips automatically. That's mostly what the tool does.

**Documentation** · [unpunnyfuns.github.io/swatchbook](https://unpunnyfuns.github.io/swatchbook/)
**Live Storybook** · [/storybook](https://unpunnyfuns.github.io/swatchbook/storybook/)

## Install

```sh
npm install -D @unpunnyfuns/swatchbook-addon
```

One package pulls the whole React surface — toolbar, preview decorator, MDX doc blocks, `ThemeSwitcher`, `useToken()`. See the [Quickstart](https://unpunnyfuns.github.io/swatchbook/quickstart) for configuration.

## Packages

| Package | Purpose |
| --- | --- |
| [`@unpunnyfuns/swatchbook-addon`](./packages/addon) | Storybook 10 addon. Re-exports the blocks + switcher React surface. |
| [`@unpunnyfuns/swatchbook-core`](./packages/core) | Framework-free DTCG loader. |
| [`@unpunnyfuns/swatchbook-blocks`](./packages/blocks) | MDX doc blocks. |
| [`@unpunnyfuns/swatchbook-switcher`](./packages/switcher) | Framework-agnostic axis / preset popover UI. |
| [`@unpunnyfuns/swatchbook-integrations`](./packages/integrations) | Tailwind v4 and CSS-in-JS adapters for the addon. |
| [`@unpunnyfuns/swatchbook-mcp`](./packages/mcp) | Model Context Protocol server for AI agents. |

Most consumers only install the addon; the rest travel transitively. Each sub-package is publishable on its own for slice-only use (e.g. the switcher in a Docusaurus navbar).

## Development

pnpm workspaces + Turborepo. Node 24. ESM.

```sh
pnpm install
pnpm dev                           # apps/storybook on :6006
pnpm turbo run lint typecheck test build
```

## Credits

Parses DTCG tokens through [Terrazzo](https://terrazzo.app/) by the [Terrazzo team](https://github.com/terrazzoapp) — its parser, resolver evaluation, and alias resolution are the foundation.

## License

MIT © [unpunnyfuns](https://github.com/unpunnyfuns).
