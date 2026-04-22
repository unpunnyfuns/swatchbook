# swatchbook-integrations

Published as `@unpunnyfuns/swatchbook-integrations`. Display-side integrations for the swatchbook Storybook addon. Each subpath ships a factory that plugs into the addon's `integrations[]` option as a `SwatchbookIntegration`.

> **Documentation:** [unpunnyfuns.github.io/swatchbook/integrations](https://unpunnyfuns.github.io/swatchbook/integrations). The addon stays tool-agnostic — integrations own their library-specific logic.

## Available subpaths

| Subpath | Covers | Consumer usage |
| --- | --- | --- |
| `./tailwind` | Tailwind v4 | Plug in; the addon auto-applies the generated `@theme` block. Write `bg-<prefix>-surface-default` / `p-<prefix>-md` utilities anywhere. |
| `./css-in-js` | emotion, styled-components, any ThemeProvider consuming a JS theme object | Plug in, then `import { theme, color, space } from 'virtual:swatchbook/theme'` where needed. Named exports, explicit import site. |

## Install

```sh
npm install -D @unpunnyfuns/swatchbook-integrations
```

Tailwind's Vite plugin is an additional dep for the `/tailwind` subpath:

```sh
npm install -D tailwindcss @tailwindcss/vite
```

## Wiring

```ts title=".storybook/main.ts"
import { defineMain } from '@storybook/react-vite/node';
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

The [per-subpath docs](https://unpunnyfuns.github.io/swatchbook/integrations) cover the consumer-facing usage for each one.

## Writing your own integration

The mechanism is sketched in the [architecture doc](https://unpunnyfuns.github.io/swatchbook/developers/architecture). In short: implement the `SwatchbookIntegration` contract from `@unpunnyfuns/swatchbook-core`, export a factory from your package, drop the factory's result into `integrations[]`.

## What this package does not do

- **Does not write artifacts to disk.** The integrations feed the Storybook preview only. For your application's production build, run [Terrazzo](https://terrazzo.app/)'s CLI against the same DTCG sources.
- **Does not cover MUI / Vuetify / Bootstrap SCSS factories.** Those need resolved values per named theme, not `var()` references. Run Terrazzo's CLI with `@terrazzo/plugin-js` for that case; display-side integrations are out of scope.

## See also

- [`@unpunnyfuns/swatchbook-core`](../core) — `SwatchbookIntegration` type, `Project` shape, the loader your integrations' `render(project)` consumes.
- [`@unpunnyfuns/swatchbook-addon`](../addon) — Storybook addon consuming `integrations[]`.
- [Integrations docs](https://unpunnyfuns.github.io/swatchbook/integrations) — per-subpath recipes.
