# @unpunnyfuns/swatchbook-addon

Storybook addon for DTCG design tokens. Wires a virtual token module into the preview, injects a per-theme stylesheet, and adds a theme switcher to the toolbar.

> M3 preview wiring: toolbar comes from the addon's `globalTypes`. The full manager UI (rich toolbar chips + Tokens/Diagnostics panel) arrives in the next PR.

## Install

```sh
pnpm add -D @unpunnyfuns/swatchbook-addon @unpunnyfuns/swatchbook-core
```

## Register

```ts
// .storybook/main.ts
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: [
    {
      name: '@unpunnyfuns/swatchbook-addon',
      options: {
        configPath: '../swatchbook.config.ts',
      },
    },
  ],
  framework: '@storybook/react-vite',
};

export default config;
```

## Options

| Option       | Type                    | What                                                     |
| ------------ | ----------------------- | -------------------------------------------------------- |
| `config`     | `Config`                | Inline swatchbook config. Mutually exclusive with below. |
| `configPath` | `string`                | Path to a config module relative to `.storybook/`.       |

Config files can be `.ts` / `.mts` / `.js` / `.mjs` — loaded via [jiti](https://github.com/unjs/jiti).

## Per-story overrides

```ts
export const DarkOnly: Story = {
  parameters: { swatchbook: { theme: 'Dark' } },
};
```
