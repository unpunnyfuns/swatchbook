# Swatchbook

A Storybook addon and supporting packages for documenting [DTCG](https://www.designtokens.org/) design tokens — parsed via [Terrazzo](https://terrazzo.app/) — inside your Storybook. Design-system engineers use it to publish a searchable, interactive reference of their token set; feature engineers and stakeholders use it to see what's available without opening token JSON files.

**Documentation:** [unpunnyfuns.github.io/swatchbook](https://unpunnyfuns.github.io/swatchbook/) (live Storybook at [`/storybook`](https://unpunnyfuns.github.io/swatchbook/storybook/)).

## Scope

Swatchbook focuses on DTCG-native projects — the current 2025.10 draft and onward. The guiding principle: **extrapolate what's in the token set; don't invent new analysis.** If Terrazzo surfaces a piece of data, we render it. If we'd have to compute something new, that's upstream work or a different tool, not ours.

Consider alternatives like Style Dictionary or Tokens Studio if you need long-term stability over the draft spec.

Monorepo published under the `@unpunnyfuns` scope.

## Packages

| Package | Purpose |
| --- | --- |
| [`@unpunnyfuns/swatchbook-core`](./packages/core) | Framework-free DTCG loader. Wraps Terrazzo's parser and DTCG 2025.10 resolver; emits CSS variables and TypeScript types. |
| [`@unpunnyfuns/swatchbook-addon`](./packages/addon) | Storybook 10 addon. Preset wires core into Vite via a virtual module, the toolbar renders one dropdown per modifier axis, the panels browse tokens and diagnostics, and `useToken()` gives typed reads from stories. |
| [`@unpunnyfuns/swatchbook-blocks`](./packages/blocks) | MDX doc blocks for Storybook docs pages. Per-type rendering — color swatches, dimension bars, typography samples, composite previews, per-token detail with the full alias chain. |
| [`@unpunnyfuns/swatchbook-tokens`](./packages/tokens-starter) | Minimal DTCG starter set (iceboxed past v0.1.0 — see `docs/decisions.md`). |

## Install

```sh
pnpm add -D @unpunnyfuns/swatchbook-addon @unpunnyfuns/swatchbook-blocks @unpunnyfuns/swatchbook-core
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
      options: { configPath: '../swatchbook.config.ts' },
    },
  ],
});
```

Opt the preview into the addon's annotations (CSF Next):

```ts
import { definePreview } from '@storybook/react-vite';
import swatchbookAddon from '@unpunnyfuns/swatchbook-addon';

export default definePreview({
  addons: [swatchbookAddon()],
});
```

Add a `swatchbook.config.ts` at the Storybook root:

```ts
import { defineSwatchbookConfig } from '@unpunnyfuns/swatchbook-core';

export default defineSwatchbookConfig({
  tokens: ['tokens/**/*.json'],
  resolver: 'tokens/resolver.json',
  cssVarPrefix: 'ds',
});
```

Every `color.sys.surface.default` (and similar) now resolves to `var(--ds-color-sys-surface-default)` at runtime, bound to the active theme via per-axis `data-*` attributes on `<html>`.

See the [documentation](https://unpunnyfuns.github.io/swatchbook/) for concepts, guides, and the full API reference.

## Theming

Swatchbook accepts a [DTCG 2025.10 resolver](https://design-tokens.org/tr/2025/drafts/resolver/) file as its primary theming input. The resolver declares `sets` (raw token files) and `modifiers` (theming axes such as mode, brand, contrast), and `resolutionOrder` specifies how they combine.

Each modifier surfaces as an independent dropdown in the toolbar. Selecting a context for each modifier determines the active theme — a simple resolver with one `theme` modifier behaves like a traditional theme switcher; a resolver with `mode × brand` presents two dropdowns and repaints as either changes.

Projects that don't want to author a resolver file can declare axes inline via `defineSwatchbookConfig({ axes: [...] })`; see [`@unpunnyfuns/swatchbook-core`](./packages/core) for the shape.

## Credits

Swatchbook parses DTCG tokens through [Terrazzo](https://terrazzo.app/) by [Drew Powers](https://github.com/drwpow) — its parser, resolver evaluation, and alias resolution are the foundation this project builds on.

## Development

pnpm workspaces + Turborepo. Node 24 (latest LTS). ESM throughout. `tsdown` for package builds.

```sh
pnpm install
pnpm dev                           # starts apps/storybook on :6006
pnpm turbo run lint typecheck test build
pnpm turbo run test:storybook      # Playwright-backed play-function tests
```

See [`CLAUDE.md`](./CLAUDE.md) for project conventions and pre-commit checks, and [`docs/plan.md`](./docs/plan.md) for the design doc and milestone history.

## License

MIT © [unpunnyfuns](https://github.com/unpunnyfuns).
