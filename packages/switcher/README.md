# swatchbook-switcher

Published as `@unpunnyfuns/swatchbook-switcher`. Framework-agnostic theme-switcher UI for swatchbook — axis pills, preset pills, color-format selector. Consumed by the Storybook addon toolbar and by any React host that knows how to set `data-*` attributes on the document to drive per-theme CSS.

> **Documentation:** [unpunnyfuns.github.io/swatchbook](https://unpunnyfuns.github.io/swatchbook/). Token parsing powered by [Terrazzo](https://terrazzo.app/) by the [Terrazzo team](https://github.com/terrazzoapp) via `@unpunnyfuns/swatchbook-core`.

## Install

Most consumers pick this up transitively via `@unpunnyfuns/swatchbook-addon` — the addon re-exports the full switcher API, so `import { ThemeSwitcher } from '@unpunnyfuns/swatchbook-addon'` works and you don't need a second install line. Reach for this package directly when you want the switcher *without* the Storybook addon (a docs-site navbar, a standalone React app using swatchbook tokens):

```sh
npm install @unpunnyfuns/swatchbook-switcher
```

## Usage

```tsx
import { ThemeSwitcher } from '@unpunnyfuns/swatchbook-switcher';

function SiteHeader({ axes, presets, themes }) {
  return (
    <ThemeSwitcher
      axes={axes}
      presets={presets}
      themes={themes}
      activeAxes={{ mode: 'Dark' }}
      colorFormat="oklch"
      onAxisChange={(axis, context) => {
        document.documentElement.setAttribute(`data-sb-${axis}`, context);
      }}
      onColorFormatChange={(format) => {
        document.documentElement.setAttribute('data-sb-color-format', format);
      }}
    />
  );
}
```

The component is pure — it doesn't read or write to storage, and it doesn't bake in any particular way of applying the active tuple. The caller decides how to translate `onAxisChange` into DOM updates, routing changes, or global state.

## Exports

| Name | Shape |
| --- | --- |
| `ThemeSwitcher` | The popover component. |
| `ThemeSwitcherProps` | Prop types — axes, presets, themes, active axis tuple, color format, change callbacks, optional `className`. |
| `SwitcherAxis` / `SwitcherPreset` / `SwitcherTheme` | JSON-friendly shapes the component accepts. Cross-compatible with `@unpunnyfuns/swatchbook-core`'s `Project.axes` / `.presets` / `.themes` — pass them through directly. |

## Where it's used inside this repo

- The Storybook addon's toolbar popover (`packages/addon/src/manager/toolbar.ts`).
- The docs site's navbar (`apps/docs/src/theme/Navbar/SwatchbookSwitcher/index.tsx`).

Both cases feed `ThemeSwitcher` a snapshot of the active `Project` and wire the callbacks to `document.documentElement.setAttribute` calls. If you're rendering swatchbook tokens on a site that isn't Storybook, mirror that pattern.

## See also

- [`@unpunnyfuns/swatchbook-addon`](../addon) — Storybook addon. Re-exports `ThemeSwitcher` along with the full blocks surface.
- [`@unpunnyfuns/swatchbook-blocks`](../blocks) — MDX doc blocks that the switcher-driven axis changes propagate to.
- [`@unpunnyfuns/swatchbook-core`](../core) — the DTCG loader whose output feeds this component.
