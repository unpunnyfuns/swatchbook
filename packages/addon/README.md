# swatchbook-addon

The Storybook 10 side of [swatchbook](https://github.com/unpunnyfuns/swatchbook).

Loads your DTCG tokens at config time, exposes the resolved graph to the preview through a virtual module, and renders a toolbar popover with one dropdown per modifier axis (`mode`, `brand`, …), preset pills, and a color-format picker. Ships a typed `useToken()` hook for stories that need a resolved value at runtime.

One install pulls the whole React surface — toolbar, preview decorator, every MDX doc block, `ThemeSwitcher`, `useToken()`. `import { TokenTable, ThemeSwitcher, useToken } from '@unpunnyfuns/swatchbook-addon'` works without a second install line because the addon re-exports the full blocks + switcher API.

## Install

```sh
npm install -D @unpunnyfuns/swatchbook-addon
```

Peer requirements: `storybook@^10.3`, `react` / `react-dom` 18+.

## Usage

The [Quickstart](https://unpunnyfuns.github.io/swatchbook/quickstart) walks through `.storybook/main.ts` + `.storybook/preview.ts` setup end to end. The short version:

```ts title=".storybook/main.ts"
addons: [
  {
    name: '@unpunnyfuns/swatchbook-addon',
    options: {
      config: {
        resolver: 'tokens/resolver.json',
        cssVarPrefix: 'ds',
      },
    },
  },
],
```

```ts title=".storybook/preview.ts"
import swatchbookAddon from '@unpunnyfuns/swatchbook-addon';
export default definePreview({ addons: [swatchbookAddon()] });
```

## `useToken`

```tsx
import { useToken } from '@unpunnyfuns/swatchbook-addon';

function Card() {
  const bg = useToken('color.surface.default');
  return <div style={{ background: bg.cssVar }}>{bg.description}</div>;
}
```

Returns `{ value, cssVar, type?, description? }`. `cssVar` is stable across themes; `value` flips with the active tuple. Paths autocomplete from the generated `.swatchbook/tokens.d.ts`.

## Credits

Token parsing and resolver evaluation come from [Terrazzo](https://terrazzo.app/) by the [Terrazzo team](https://github.com/terrazzoapp) via `@unpunnyfuns/swatchbook-core`.

## Documentation

[unpunnyfuns.github.io/swatchbook](https://unpunnyfuns.github.io/swatchbook/) — concepts, guides, and full API reference.
