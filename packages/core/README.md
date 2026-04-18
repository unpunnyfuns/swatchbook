# Core

Published as `@unpunnyfuns/swatchbook-core`. Framework-free DTCG loader. Parses token files via [Terrazzo](https://terrazzo.app/), resolves aliases, composes themes through a DTCG 2025.10 resolver, and emits CSS variables and TypeScript types.

> **Documentation:** [unpunnyfuns.github.io/swatchbook](https://unpunnyfuns.github.io/swatchbook/).

## Install

```sh
pnpm add @unpunnyfuns/swatchbook-core
```

## Public API

| Export | Purpose |
| --- | --- |
| `defineSwatchbookConfig(config)` | Identity helper for a typed `swatchbook.config.ts`. |
| `loadProject(config, cwd?)` | Parse + resolve — returns `Project { axes, themes, themesResolved, graph, diagnostics, … }`. |
| `resolveTheme(project, name)` | Pick a single composed theme out of a project. |
| `emitCss(themes, themesResolved, options?)` | Concatenated stylesheet — `:root` for the default tuple plus one compound-selector block per non-default tuple (`[data-mode="Dark"][data-brand="Brand A"] { … }`). Single-axis projects keep the familiar `[data-theme="…"]` shape. |
| `projectCss(project)` | Same as `emitCss` with project defaults (prefix + axes) applied. |
| `emitTypes(project)` | TypeScript source declaring the token-path union + `SwatchbookTokenMap`. |
| `permutationID(input)` | Stringify a tuple (`{ mode: 'Dark', brand: 'Brand A' }` → `"Dark · Brand A"`) to the form used as `Theme.name` and CSS data-attribute values. |
| Types | `Axis`, `AxisConfig`, `Config`, `Preset`, `Theme`, `Project`, `ResolvedTheme`, `TokenMap`, `Diagnostic`, `DiagnosticSeverity`. |

## Minimal config

```ts
import { defineSwatchbookConfig } from '@unpunnyfuns/swatchbook-core';

export default defineSwatchbookConfig({
  resolver: 'tokens/resolver.json',
  default: { mode: 'Light', brand: 'Default' },
  cssVarPrefix: 'sb',
});
```

The resolver file is the spec-defined document describing how token sets compose into named themes — see [the DTCG 2025.10 resolver draft](https://design-tokens.org/tr/2025/drafts/resolver/). Every token file the resolver references via `$ref` is loaded automatically; the addon's Vite plugin derives HMR watch paths from that set, so no separate `tokens` glob is needed for resolver-backed projects.

If you want HMR to watch a directory broader than the resolver references directly — say, to pick up a new token file the moment it's added — supply `tokens: ['tokens/**/*.json']` alongside `resolver` and the plugin will union the two.

Projects without a resolver (plain-parse or layered-axes) still need `tokens` — the loader has nothing to start from otherwise.

`default` is a partial tuple keyed by axis name. Any axis you omit falls back to that axis's own `default`; unknown keys and invalid context values produce `warn` diagnostics and are sanitized out. Omit `default` entirely to start the project in the all-axis-defaults tuple.

### Layered axes (resolver-less)

Projects that don't want to author a DTCG resolver can declare axes inline. Each context names an ordered list of overlay files that layer on top of `tokens` for that context; for every combination of axis contexts, Swatchbook parses `[...base, ...overlaysInAxisOrder]` with alias resolution — last write wins on duplicate token paths:

```ts
import { defineSwatchbookConfig } from '@unpunnyfuns/swatchbook-core';

export default defineSwatchbookConfig({
  tokens: ['tokens/base/**/*.json'],
  axes: [
    {
      name: 'mode',
      contexts: {
        Light: [],
        Dark: ['tokens/modes/dark.json'],
      },
      default: 'Light',
    },
    {
      name: 'brand',
      contexts: {
        Default: [],
        'Brand A': ['tokens/brands/brand-a.json'],
      },
      default: 'Default',
    },
  ],
});
```

- ✅ Empty context arrays are legal — they mean "no override" (common for a `Default` context).
- ❌ Setting both `resolver` and `axes` is an error. Pick one.
- ❌ Setting neither falls back to a single synthetic `theme` axis (unchanged behavior).

## Load + emit

```ts
import { loadProject, projectCss, emitTypes } from '@unpunnyfuns/swatchbook-core';

const project = await loadProject(config, process.cwd());

const css = projectCss(project);
const dts = emitTypes(project);
```

`project.diagnostics` is always populated — severity is `'error' | 'warn' | 'info'`. The addon surfaces these in its Diagnostics panel; your own pipeline can inspect / `throw` on `severity === 'error'` as fits.

## Axes and theme naming

`Project.axes` surfaces the theming modifiers as first-class — one `Axis` per resolver modifier (`source: 'resolver'`) or per authored layered axis (`source: 'layered'`), each with its `contexts`, `default`, and `description`. Projects loaded with neither a resolver nor `axes` fall back to a single synthetic axis named `theme` (`source: 'synthetic'`).

Theme names are derived from the axis tuple via `permutationID(input)`: single-axis tuples stringify to the context value alone (`{ theme: 'Light' }` → `"Light"`); multi-axis tuples join context values with ` · ` (`{ mode: 'Dark', brand: 'Brand A' }` → `"Dark · Brand A"`). Pick sensible context names — what you write is what the toolbar shows. Consuming code should prefer `axes` + `themes[].input` over matching names by string.

## Presets

`config.presets` lets you name tuple combinations authors want quick access to — the addon renders them as toolbar pills, and downstream consumers can read them from `Project.presets`.

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

Each preset names a partial tuple; any axis the preset omits resolves to that axis's `default` when applied. `loadProject` validates presets: unknown axis keys and invalid context values surface as `warn` diagnostics and are sanitized out, but the preset stays in `Project.presets` (an empty preset is still a valid tuple).

## CSS emission

Multi-axis projects emit one `:root` block with the default-tuple values, plus one block per non-default combination of axis contexts keyed on a compound attribute selector in `Project.axes` order:

```css
:root { --sb-color-sys-surface-default: rgb(255 255 255); … }
[data-mode="Dark"][data-brand="Default"] { --sb-color-sys-surface-default: rgb(17 17 17); … }
[data-mode="Light"][data-brand="Brand A"] { … }
[data-mode="Dark"][data-brand="Brand A"] { … }
```

Every var is redeclared inside every block (flat emission). Nested cascading would be smaller but breaks whenever axes collide at the same token path — see `docs/decisions.md` for the rationale. Consumers flip tuples by writing one `data-<axis>="<context>"` attribute per axis on an ancestor (typically `<html>`).

Single-axis projects (one resolver modifier, or the synthetic `theme` axis) keep the familiar `[data-theme="…"]` shape — the compound selector collapses to a single attribute selector anyway, so the simpler form stays readable.

## Do / don't

- ✅ Use this package at build time — Node, scripts, SSR, storybook presets. It has no DOM or React dependency.
- ✅ Treat `emitCss` output as the source of truth for CSS vars; don't parallel-hand-write them.
- ❌ Don't import from `@terrazzo/parser` directly unless you need features core doesn't expose. Stay on the core surface so upgrades don't churn your code.
- ❌ Don't ship the `Project` object to the browser — it's node-parsed and carries full raw-AST references. Use `emitCss` / `emitTypes` / `themesResolved` projections instead.

## Credits

Token parsing, alias resolution, and DTCG resolver evaluation are provided by [Terrazzo](https://terrazzo.app/) by [Drew Powers](https://github.com/drwpow). This package wraps those APIs into a Swatchbook-shaped project.

## See also

- [`@unpunnyfuns/swatchbook-addon`](../addon) — the Storybook wrapper. Uses `loadProject` at startup, exposes results over a virtual module.
- [`@unpunnyfuns/swatchbook-blocks`](../blocks) — React doc blocks consumed from MDX.
- [Project README](../../README.md) — install + wiring flow for the whole toolchain.
- [Documentation](https://unpunnyfuns.github.io/swatchbook/) — concepts, guides, and full API reference.
