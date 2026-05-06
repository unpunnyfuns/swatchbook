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
import { ThemeSwitcher, type SwitcherPreset } from '@unpunnyfuns/swatchbook-switcher';
import '@unpunnyfuns/swatchbook-switcher/style.css';

<ThemeSwitcher
  axes={axes}
  presets={presets}
  themes={themes}
  activeTuple={{ mode: 'Dark' }}
  defaults={{ mode: 'Light', brand: 'Default', contrast: 'Normal' }}
  lastApplied={null}
  onAxisChange={(axis, context) => {
    document.documentElement.setAttribute(`data-sb-${axis}`, context);
  }}
  onPresetApply={(preset: SwitcherPreset) => {
    for (const [axis, value] of Object.entries(preset.axes)) {
      document.documentElement.setAttribute(`data-sb-${axis}`, value);
    }
  }}
/>;
```

The component is pure — it doesn't read or write to storage, and it doesn't bake in any particular way of applying the active tuple. The caller decides how to translate `onAxisChange` / `onPresetApply` into DOM updates, routing changes, or global state.

Color-format selection isn't part of the switcher — hosts that need it slot a `<ColorFormatSelector>` (or any other custom node) into the optional `footer` prop.

`SwitcherAxis` / `SwitcherPreset` / `SwitcherTheme` are the accepted shapes and are cross-compatible with `Project.axes` / `.presets` / `.themes` from `@unpunnyfuns/swatchbook-core` — pass them through directly.

## Credits

Token parsing and resolver evaluation come from [Terrazzo](https://terrazzo.app/) by the [Terrazzo team](https://github.com/terrazzoapp) via `@unpunnyfuns/swatchbook-core`.

## Documentation

[unpunnyfuns.github.io/swatchbook](https://unpunnyfuns.github.io/swatchbook/) — concepts, guides, and full API reference.
