# Addon

Published as `@unpunnyfuns/swatchbook-addon`. Storybook 10 addon for DTCG design tokens. Loads your tokens at config time (via `@unpunnyfuns/swatchbook-core`), exposes the resolved graph to the preview through a virtual module, renders one toolbar dropdown per modifier axis (`mode`, `brand`, and so on) plus a unified Design Tokens panel (hierarchical tree + diagnostics), and ships a `useToken()` hook with typed paths.

> **Documentation:** [unpunnyfuns.github.io/swatchbook](https://unpunnyfuns.github.io/swatchbook/). Token parsing powered by [Terrazzo](https://terrazzo.app/) by the [Terrazzo team](https://github.com/terrazzoapp) via `@unpunnyfuns/swatchbook-core`.

## Install

```sh
npm install -D @unpunnyfuns/swatchbook-addon @unpunnyfuns/swatchbook-core
```

This gives you the toolbar, Design Tokens panel (hierarchical tree view with diagnostics), preview decorator, and the `useToken()` hook. The MDX doc blocks (`TokenTable`, `ColorPalette`, `TokenDetail`, `SwatchbookProvider`, block-side hooks) live in the sibling package — add it alongside if you want them:

```sh
npm install @unpunnyfuns/swatchbook-blocks
```

Peer requirements: `storybook@^10.3`, `react` / `react-dom` 18+.

## Register

`.storybook/main.ts` — CSF Next. Inline config is the recommended path; the separate `swatchbook.config.ts` file is an escape hatch for sharing config with other tooling (see below).

```ts
import { defineMain } from '@storybook/react-vite/node';

export default defineMain({
  stories: ['../src/**/*.stories.@(ts|tsx)', '../src/**/*.mdx'],
  framework: '@storybook/react-vite',
  addons: [
    {
      name: '@unpunnyfuns/swatchbook-addon',
      options: {
        config: {
          resolver: 'tokens/resolver.json',
          default: { mode: 'Light' },
          cssVarPrefix: 'ds',
        },
      },
    },
  ],
});
```

`.storybook/preview.ts` — opt the preview into the addon's annotations (decorator, globalTypes, initialGlobals):

```ts
import { definePreview } from '@storybook/react-vite';
import swatchbookAddon from '@unpunnyfuns/swatchbook-addon';

export default definePreview({
  addons: [swatchbookAddon()],
});
```

## Options

| Option       | Type     | What                                                              |
| ------------ | -------- | ----------------------------------------------------------------- |
| `config`     | `Config` | Inline swatchbook config. Recommended for most projects. Mutually exclusive with `configPath`. |
| `configPath` | `string` | Path to a config module relative to `.storybook/`. Loaded via jiti so `.ts` / `.mts` / `.js` / `.mjs` all work. Use when the same config is consumed by other tooling (a CLI, CI lint, external build script). |

## `useToken`

```ts
import { useToken } from '@unpunnyfuns/swatchbook-addon/hooks';

function Card() {
  const bg = useToken('color.surface.default');
  const radius = useToken('radius.lg');
  return (
    <div style={{ background: bg.cssVar, borderRadius: radius.cssVar }}>
      {bg.description}
    </div>
  );
}
```

Returns `{ value, cssVar, type?, description? }`. `cssVar` is stable across themes; `value` flips with the active theme. Paths autocomplete from the generated `.swatchbook/tokens.d.ts` once the addon has run against your project.

## Toolbar pills (presets)

Add `presets` to your `swatchbook.config.ts` to surface quick-select pills next to the axis dropdowns:

```ts
export default defineSwatchbookConfig({
  tokens: ['tokens/**/*.json'],
  resolver: 'tokens/resolver.json',
  presets: [
    { name: 'Default Light', axes: { mode: 'Light', brand: 'Default' } },
    { name: 'Brand A Dark', axes: { mode: 'Dark', brand: 'Brand A' }, description: 'Dark + violet accent.' },
  ],
});
```

Clicking a pill writes the full tuple — partial presets fill in omitted axes from each axis's default. The active pill is highlighted when the current tuple matches; if you tweak an axis dropdown after applying a preset, the pill shows a small "modified" dot so you can see that the current tuple has drifted from the named preset. Presets come from config only — there is no in-session "save as".

## Per-story overrides

```ts
export const DarkBrandA = meta.story({
  parameters: { swatchbook: { axes: { mode: 'Dark', brand: 'Brand A' } } },
});
```

`axes` is a tuple of `{ axisName: contextName }` entries. Any axis left out falls back to its default; unknown keys or contexts are silently ignored. The legacy `theme: 'Composed Name'` form is still accepted for single-axis overrides.

## Do / don't

- ✅ Use `useToken` for typed lookups when you need the resolved value at runtime (aria labels, conditional rendering, …).
- ✅ Prefer `var(--…)` in CSS; `useToken().cssVar` gives you the right string programmatically.
- ❌ Don't import from `virtual:swatchbook/tokens` directly in consumer code. Go through `useToken` / the panel / the doc blocks so the API stays stable if we change the virtual module's shape.
- ❌ Don't combine `parameters.swatchbook.theme` *and* the toolbar for the same story — the parameter wins and the toolbar change won't stick.

## See also

- [`@unpunnyfuns/swatchbook-core`](../core) — the loader this addon wraps. Consume directly if you need DTCG processing outside Storybook.
- [`@unpunnyfuns/swatchbook-blocks`](../blocks) — MDX doc blocks that build on this addon's virtual module.
- [Project README](../../README.md) — install and wiring flow for the whole toolchain.
- [Documentation](https://unpunnyfuns.github.io/swatchbook/) — concepts, guides, and full API reference.
