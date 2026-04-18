# @unpunnyfuns/swatchbook-addon

Storybook 10 addon for DTCG design tokens. Loads your tokens at config time (via `@unpunnyfuns/swatchbook-core`), exposes the resolved graph to the preview over a virtual module, renders a theme switcher in the toolbar and a browser + diagnostics panel, and ships a `useToken()` hook with typed paths.

## Install

```sh
pnpm add -D @unpunnyfuns/swatchbook-addon @unpunnyfuns/swatchbook-core
```

Peer requirements: `storybook@^10.3`, `react` / `react-dom` 18+.

## Register

`.storybook/main.ts` — CSF Next:

```ts
import { defineMain } from '@storybook/react-vite/node';

export default defineMain({
  stories: ['../src/**/*.stories.@(ts|tsx)', '../src/**/*.mdx'],
  framework: '@storybook/react-vite',
  addons: [
    {
      name: '@unpunnyfuns/swatchbook-addon',
      options: {
        configPath: '../swatchbook.config.ts',
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
| `config`     | `Config` | Inline swatchbook config. Mutually exclusive with `configPath`.   |
| `configPath` | `string` | Path to a config module relative to `.storybook/`. Loaded via jiti so `.ts` / `.mts` / `.js` / `.mjs` all work. |

## `useToken`

```ts
import { useToken } from '@unpunnyfuns/swatchbook-addon/hooks';

function Card() {
  const bg = useToken('color.sys.surface.default');
  const radius = useToken('radius.sys.lg');
  return (
    <div style={{ background: bg.cssVar, borderRadius: radius.cssVar }}>
      {bg.description}
    </div>
  );
}
```

Returns `{ value, cssVar, type?, description? }`. `cssVar` is stable across themes; `value` flips with the active theme. Paths autocomplete from the generated `.swatchbook/tokens.d.ts` once the addon has run against your project.

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
- [Project README](../../README.md) — the full install + wiring flow.
