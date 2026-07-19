# swatchbook-switcher

The framework-agnostic theme-switcher UI for [swatchbook](https://github.com/unpunnyfuns/swatchbook).

A React component: axis dropdowns and preset pills, with an optional `footer` slot for host-supplied controls. The Storybook addon's toolbar uses it; so does the docs-site navbar. Reach for this package directly when you want the switcher on a non-Storybook site, such as a docs navbar or a standalone React app consuming swatchbook tokens.

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
  activeTuple={{ mode: 'Dark' }}
  defaults={{ mode: 'Light', brand: 'Default', contrast: 'Normal' }}
  lastApplied={null}
  onAxisChange={(axisName, next) => {
    document.documentElement.setAttribute(`data-sb-${axisName}`, next);
  }}
  onPresetApply={(preset: SwitcherPreset) => {
    for (const [axis, value] of Object.entries(preset.axes)) {
      if (value !== undefined) document.documentElement.setAttribute(`data-sb-${axis}`, value);
    }
  }}
/>;
```

The component is pure: it doesn't read or write to storage, and it doesn't bake in any particular way of applying the active tuple. The caller decides how to translate `onAxisChange` / `onPresetApply` into DOM updates, routing changes, or global state.

Neither switcher mount (the Storybook addon toolbar, the docs-site navbar) renders a color-format control: blocks read `Config.defaultColorFormat` for their starting format. The package exports `<ColorFormatSelector>` for a host that wants one anyway; slot it (or any other custom node) into the optional `footer` prop.

`SwitcherAxis` / `SwitcherPreset` are the accepted shapes and are cross-compatible with `Project.axes` / `Project.presets` from `@unpunnyfuns/swatchbook-core`, so pass them through directly. `SwitcherAxis.source` mirrors core's own source classification; the two packages version that union in lockstep.

Beyond the `--swatchbook-*` custom properties, `./style.css`'s `.sb-switcher` / `.sb-switcher__*` BEM class names are the stable override surface for restyling. The root element also carries `data-testid="swatchbook-switcher"` — a DOM contract the Storybook addon's click-outside handling relies on, not just a test hook.

## Credits

Token parsing and resolver evaluation come from [Terrazzo](https://terrazzo.app/) by the [Terrazzo team](https://github.com/terrazzoapp) via `@unpunnyfuns/swatchbook-core`.

## Documentation

[unpunnyfuns.github.io/swatchbook](https://unpunnyfuns.github.io/swatchbook/): concepts, guides, and full API reference.
