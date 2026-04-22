# swatchbook-integrations

Published as `@unpunnyfuns/swatchbook-integrations`. Display-side integrations for the swatchbook Storybook addon. Each subpath ships a factory that plugs into the addon's `integrations[]` option as a `SwatchbookIntegration` and contributes a virtual module the preview imports.

> **Documentation:** [unpunnyfuns.github.io/swatchbook/next/integrations](https://unpunnyfuns.github.io/swatchbook/next/integrations). The addon itself stays tool-agnostic — integrations own their library-specific logic.

## Available subpaths

| Subpath | Covers | Virtual module |
| --- | --- | --- |
| `./tailwind` | Tailwind v4 | `virtual:swatchbook/tailwind.css` — `@theme` block aliasing Tailwind utility scales to DTCG tokens |
| `./css-in-js` | emotion, styled-components, any ThemeProvider consuming a JS theme object | `virtual:swatchbook/theme` — typed JS accessor with `var(--<cssVarPrefix>-*)` leaves |

## Install

```sh
npm install -D @unpunnyfuns/swatchbook-integrations
```

Tailwind's Vite plugin is an additional dep for the `/tailwind` subpath:

```sh
npm install -D tailwindcss @tailwindcss/vite
```

## Wiring

Plug integrations into the addon options in `.storybook/main.ts`:

```ts
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

Each integration contributes a virtual module the preview imports:

```ts
// .storybook/preview.tsx
import 'virtual:swatchbook/tailwind.css';             // from /tailwind
import { theme } from 'virtual:swatchbook/theme';    // from /css-in-js
```

The addon's Vite plugin resolves the virtual IDs, runs `render(project)` on load, and invalidates the modules on HMR so outputs stay in lockstep with the toolbar.

## Writing your own integration

A `SwatchbookIntegration` is a tiny shape exported from `@unpunnyfuns/swatchbook-core`:

```ts
interface SwatchbookIntegration {
  name: string;
  virtualModule?: {
    virtualId: string;
    render(project: Project): string;
  };
}
```

Return one from a factory in your own package; drop it into `integrations[]`. The addon handles resolution, HMR invalidation, and serving. See the [architecture doc](https://unpunnyfuns.github.io/swatchbook/next/developers/architecture) for the full contract.

## What this package does not do

- **Does not write artifacts to disk.** The integrations serve virtual modules during Storybook dev/build only. For your application's production build, use `emitViaTerrazzo` in `@unpunnyfuns/swatchbook-core` or Terrazzo's own CLI.
- **Does not support layered (`config.axes`) projects** for integrations that drive Terrazzo's plugin pipeline. `/tailwind` and `/css-in-js` work with any loader path; future Terrazzo-backed integrations require a resolver-backed project (see decision 2026-04-22 in the repo's `decisions.md`).
- **Does not cover MUI / Vuetify / Bootstrap SCSS factories.** Those need resolved values per named theme, not `var()` references. Deferred until demand surfaces.

## See also

- [`@unpunnyfuns/swatchbook-core`](../core) — `SwatchbookIntegration` type, `Project` shape, `emitViaTerrazzo` for library-level emission.
- [`@unpunnyfuns/swatchbook-addon`](../addon) — Storybook addon consuming `integrations[]`.
- [Integrations docs](https://unpunnyfuns.github.io/swatchbook/next/integrations) — per-subpath recipes.
