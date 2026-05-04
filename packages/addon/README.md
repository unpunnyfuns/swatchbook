# swatchbook-addon

Storybook 10 addon for documenting DTCG design tokens.

Loads your token files, resolves the alias graph, and adds a toolbar that flips the active theme tuple (`mode × brand × contrast × …`). Every story and MDX doc block re-renders against the new tuple without per-story wiring — component stories and the token reference share one source of truth.

Bundles MDX doc blocks (`<TokenTable />`, `<ColorPalette />`, `<TokenDetail />`, …), a standalone `<ThemeSwitcher>` for non-Storybook surfaces, and a typed `useToken()` hook for stories that need a resolved value at runtime. Re-exports [`@unpunnyfuns/swatchbook-blocks`](../blocks) and [`@unpunnyfuns/swatchbook-switcher`](../switcher) — a single install covers the whole React surface.

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
