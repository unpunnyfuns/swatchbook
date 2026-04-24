# swatchbook-core

Published as `@unpunnyfuns/swatchbook-core`. Framework-free DTCG loader. Parses token files via [Terrazzo](https://terrazzo.app/), resolves aliases, and composes themes through a DTCG 2025.10 resolver or authored layered axes.

> **Documentation:** [unpunnyfuns.github.io/swatchbook](https://unpunnyfuns.github.io/swatchbook/).

## Install

```sh
npm install @unpunnyfuns/swatchbook-core
```

Install directly when you're using `loadProject` outside Storybook — build scripts, CLIs, docs-site generators, your own tooling that needs the axis-composed token graph. Storybook consumers get core transitively via `@unpunnyfuns/swatchbook-addon` and don't need a separate install.

For production asset emission (CSS variables, JS theme objects, Tailwind config, Swift constants, …), run [Terrazzo](https://terrazzo.app/)'s CLI against the same DTCG sources. This package's job ends at the composed `Project`; downstream targets are Terrazzo's ecosystem.

## Public API

| Export | Purpose |
| --- | --- |
| `defineSwatchbookConfig(config)` | Identity helper for a typed `swatchbook.config.ts`. |
| `loadProject(config, cwd?)` | Parse + resolve — returns `Project { axes, themes, themesResolved, graph, diagnostics, … }`. |
| `resolveTheme(project, name)` | Pick a single composed theme out of a project. |
| `permutationID(input)` | Stringify a tuple (`{ mode: 'Dark', brand: 'Brand A' }` → `"Dark · Brand A"`) to the form used as `Theme.name` and CSS data-attribute values. |
| Types | `Axis`, `AxisConfig`, `Config`, `Preset`, `Theme`, `Project`, `ResolvedTheme`, `TokenMap`, `Diagnostic`, `DiagnosticSeverity`, `SwatchbookIntegration`. |

## Minimal config

```ts
import { defineSwatchbookConfig } from '@unpunnyfuns/swatchbook-core';

export default defineSwatchbookConfig({
  resolver: 'tokens/resolver.json',
  default: { mode: 'Light', brand: 'Default' },
  cssVarPrefix: 'sb',
});
```

The resolver file is the spec-defined document describing how token sets compose into named themes — see [the DTCG 2025.10 resolver draft](https://www.designtokens.org/TR/2025.10/resolver/). Every token file the resolver references via `$ref` is loaded automatically; the addon's Vite plugin derives HMR watch paths from that set, so no separate `tokens` glob is needed for resolver-backed projects.

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

## Load

```ts
import { loadProject } from '@unpunnyfuns/swatchbook-core';

const project = await loadProject(config, process.cwd());
// project.themesResolved[themeName] — ready to read, no further I/O.
```

`project.diagnostics` is always populated — severity is `'error' | 'warn' | 'info'`. The addon surfaces these in its Design Tokens panel; your own pipeline can inspect / `throw` on `severity === 'error'` as fits.

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

## Disabling axes

`config.disabledAxes` suppresses declared axes from the toolbar, CSS emission, and theme enumeration — each listed axis is pinned to its `default` context and drops out of `Project.axes`. Useful when the resolver declares a work-in-progress modifier you don't want surfaced yet, without editing the resolver document.

```ts
export default defineSwatchbookConfig({
  resolver: 'tokens/resolver.json',
  disabledAxes: ['contrast'],
});
```

- Disabled names land on `Project.disabledAxes` so panels and blocks can still indicate the axis exists but is pinned.
- Unknown axis names produce `warn` diagnostics (group `swatchbook/disabled-axes`) and are ignored.
- Config-level only — there's no runtime toggle.

## Do / don't

- ✅ Use this package at build time — Node, scripts, SSR, storybook presets. It has no DOM or React dependency.
- ✅ Use Terrazzo's CLI for production artifact emission against the same DTCG sources.
- ❌ Don't import from `@terrazzo/parser` directly unless you need features core doesn't expose. Stay on the core surface so upgrades don't churn your code.
- ❌ Don't ship the `Project` object to the browser — it's node-parsed and carries full raw-AST references. Use `themesResolved` projections instead.

## Credits

Token parsing, alias resolution, and DTCG resolver evaluation are provided by [Terrazzo](https://terrazzo.app/) by the [Terrazzo team](https://github.com/terrazzoapp). This package wraps those APIs into a Swatchbook-shaped project.

## See also

- [`@unpunnyfuns/swatchbook-addon`](../addon) — the Storybook wrapper. Uses `loadProject` at startup, exposes results over a virtual module.
- [`@unpunnyfuns/swatchbook-blocks`](../blocks) — React doc blocks consumed from MDX.
- [Project README](../../README.md) — install + wiring flow for the whole toolchain.
- [Documentation](https://unpunnyfuns.github.io/swatchbook/) — concepts, guides, and full API reference.
