# swatchbook-switcher

The framework-agnostic theme-switcher UI for [swatchbook](https://github.com/unpunnyfuns/swatchbook).

A React component: axis dropdowns, preset pills, color-format selector. The Storybook addon's toolbar uses it; so does the docs-site navbar. Reach for this package directly when you want the switcher on a non-Storybook site — a docs navbar, a standalone React app consuming swatchbook tokens.

Most consumers pick it up transitively via [`@unpunnyfuns/swatchbook-addon`](../addon); `import { ThemeSwitcher } from '@unpunnyfuns/swatchbook-addon'` works out of the box.

## Install

```sh
npm install @unpunnyfuns/swatchbook-switcher
```

## Usage

```tsx
import { ThemeSwitcher } from '@unpunnyfuns/swatchbook-switcher';

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
/>;
```

The component is pure — it doesn't read or write to storage, and it doesn't bake in any particular way of applying the active tuple. The caller decides how to translate `onAxisChange` into DOM updates, routing changes, or global state.

`SwitcherAxis` / `SwitcherPreset` / `SwitcherTheme` are the accepted shapes and are cross-compatible with `Project.axes` / `.presets` / `.themes` from `@unpunnyfuns/swatchbook-core` — pass them through directly.

## Credits

Token parsing and resolver evaluation come from [Terrazzo](https://terrazzo.app/) by the [Terrazzo team](https://github.com/terrazzoapp) via `@unpunnyfuns/swatchbook-core`.

## Documentation

[unpunnyfuns.github.io/swatchbook](https://unpunnyfuns.github.io/swatchbook/) — concepts, guides, and full API reference.
