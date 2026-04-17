# Swatchbook

Storybook addon + MDX doc blocks for [DTCG](https://www.designtokens.org/) design tokens. Browse tokens, switch themes from the toolbar, render tokens in docs, read typed tokens from JS — all wired to your DTCG source of truth with live HMR.

Monorepo published under the `@unpunnyfuns` scope.

## Packages

| Package | Purpose |
| --- | --- |
| [`@unpunnyfuns/swatchbook-core`](./packages/core) | Framework-free DTCG loader. Parses token files, resolves aliases, composes themes (explicit layers, DTCG 2025.10 resolvers, or Tokens Studio `$themes` manifests), emits CSS variables + TypeScript types. |
| [`@unpunnyfuns/swatchbook-addon`](./packages/addon) | Storybook 10 addon. Preset wires core into Vite via a virtual module, the toolbar tool switches themes, the panel browses tokens + diagnostics, `useToken()` gives typed reads from your stories. |
| [`@unpunnyfuns/swatchbook-blocks`](./packages/blocks) | MDX doc blocks consumed from Storybook docs pages — `TokenTable`, `ColorPalette`, `TypographyScale`, `TokenDetail`. Self-mount the addon's CSS and react to toolbar theme changes. |
| [`@unpunnyfuns/swatchbook-tokens`](./packages/tokens-starter) | Opinionated starter token set. Prebuilt CSS per theme + typed JSON + token-path unions. Install to get something working in five minutes. |

## Install

```
pnpm add -D @unpunnyfuns/swatchbook-addon @unpunnyfuns/swatchbook-blocks
pnpm add @unpunnyfuns/swatchbook-tokens  # or bring your own tokens/
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
        configPath: '../swatchbook.config.ts',
      },
    },
  ],
});
```

Opt in inside the preview (CSF Next):

```ts
import { definePreview } from '@storybook/react-vite';
import swatchbookAddon from '@unpunnyfuns/swatchbook-addon';

export default definePreview({
  addons: [swatchbookAddon()],
});
```

Drop a `swatchbook.config.ts` at the storybook root:

```ts
import { defineConfig } from '@unpunnyfuns/swatchbook-core';

export default defineConfig({
  tokens: ['tokens/**/*.json'],
  resolver: 'tokens/resolver.json', // or use `themes:` for explicit layers — pick one
  default: 'Light',
  cssVarPrefix: 'sb',
});
```

Every `color.sys.surface.default` (and friends) now resolves to `var(--sb-color-sys-surface-default)` at runtime, bound to the active theme via `<html data-theme="…">`.

## Two ways to theme

- **DTCG 2025.10 resolver** (`resolver: 'tokens/resolver.json'`) — native to the spec. Recommended.
- **Explicit layers** (`themes: [{ name, layers: [glob, …] }]`) — our file-glob shortcut when you want to name compositions yourself.

Core normalizes both into the same internal shape. A core unit test pins equivalence: the same logical composition through either path produces the same resolved values.

See [`docs/plan.md`](./docs/plan.md) for the full design doc.

## Storybook MCP

`apps/storybook` ships an MCP server via `@storybook/addon-mcp` at `http://localhost:6006/mcp` — useful when driving Claude Code or other MCP clients against a running Storybook.

The MCP endpoint only exists while Storybook is running. **Start order matters**:

```
# Terminal 1
pnpm dev           # = turbo run storybook — launches on :6006

# Terminal 2
claude             # MCP tools for Storybook now resolve
```

Starting Claude before Storybook makes the MCP handshake fail silently. If that happens, restart Claude after Storybook comes up.

## Development

Monorepo with pnpm workspaces + Turborepo. Node 24 (latest LTS). ESM everywhere. `tsdown` for package builds.

```
pnpm install
pnpm dev            # start the docs storybook
pnpm turbo run lint typecheck test build
pnpm turbo run test:storybook    # play-function interaction tests (chromium)
```

More in [`CLAUDE.md`](./CLAUDE.md) (project conventions + pre-commit checks) and [`docs/plan.md`](./docs/plan.md) (milestones, architecture).

## License

MIT © [unpunnyfuns](https://github.com/unpunnyfuns).
