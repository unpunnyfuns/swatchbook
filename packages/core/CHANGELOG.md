# @unpunnyfuns/swatchbook-core

## 0.1.3

## 0.1.2

## 0.1.1

## 0.1.0

### Minor Changes

- 9d862a3: `Config.default` now takes a partial tuple object (`{ axisName: contextName }`) instead of a composed permutation string. Partial tuples fill omitted axes from each axis's own `default`; unknown axis keys and invalid context values surface as `warn` diagnostics (group `swatchbook/default`) and are sanitized out. Omit `default` entirely to start in the all-axis-defaults tuple.

  Migration: replace `default: 'Light · Default'` with `default: { mode: 'Light', brand: 'Default' }` (or omit the field if the all-defaults tuple is fine).

- 5072345: New `Config.disabledAxes?: string[]` suppresses declared axes from the toolbar, CSS emission, and theme enumeration without editing the resolver. Each listed axis pins to its `default` context: `Project.axes` drops it, `Project.themes` collapses to the default-context slice, CSS emission stops including it in compound selectors, and the addon's toolbar skips the dropdown. The tokens panel shows a small pinned indicator so the suppression stays visible. Unknown axis names surface as `warn` diagnostics (group `swatchbook/disabled-axes`) and are ignored. Filtered-out names land on the new `Project.disabledAxes: string[]` for downstream tooling. Config-level only — no runtime toggle.
- 0cb84fd: Drop the explicit-layers theming input. The DTCG 2025.10 resolver is now the sole theming input — `Config.themes`, the `ThemeConfig` type, and `resolveThemingMode` are all gone. Consumers with a layered config must move to a `resolver.json`.

  Theme names come from the resolver's modifier contexts: single-axis resolvers use the modifier value directly (context `Light` → theme name `Light`), multi-axis resolvers keep Terrazzo's JSON-encoded permutation ID. Pick sensible modifier context names in your resolver; what you write is what consumers see.

  The `themingMode` field on the virtual module is also removed — there's only one mode to be in.

- 6c7bfe5: Drop Tokens Studio `$themes` manifest support. The DTCG 2025.10 resolver is now the spec-native theming input; consumers using a manifest should convert to a `resolver.json` (the transformation is mechanical). `Config.manifest` is removed, `resolveThemingMode` returns `'layered' | 'resolver'`, and `themingMode` on the virtual module narrows accordingly. `@unpunnyfuns/swatchbook-tokens-reference` no longer exports `manifestPath`.
- 8db913b: Extend `defineSwatchbookConfig` with an `axes` shape for authored layered configurations — no DTCG resolver file required. Each axis lists its contexts as ordered file lists that overlay onto `tokens`; the loader parses `[...base, ...overlaysInAxisOrder]` once per cartesian tuple with alias resolution (last-write-wins on duplicate token paths). `Config.resolver` is now optional; setting both `resolver` and `axes` throws. Layered axes surface on `Project.axes` with `source: 'layered'`.
- d45d5da: Multi-axis permutation IDs now join tuple values with `·` instead of Terrazzo's JSON-encoded format, so data-attribute values and toolbar labels stay readable. Single-axis resolvers are unchanged (modifier value used directly). Consumers pinning theme names by string (`parameters.swatchbook.theme`, `Config.default`) update from `'Light'` / `'Dark'` to `'Light · Default'` / `'Dark · Default'` when switching to a multi-axis resolver. The stringification is a stopgap until `Project.axes` exposes modifier structure directly (issue #131).
- 37933a3: `Config.tokens` is now optional when `config.resolver` is set. The resolver's own `$ref` targets fully determine what gets loaded, and `Project.sourceFiles` exposes every file touched so the addon's Vite plugin can derive HMR watch paths without a parallel `tokens` glob. Supplying `tokens` alongside `resolver` still works — the watch paths union with the resolver-derived set, useful when you want HMR to watch broader directories than the resolver references.

  Plain-parse (no resolver, no axes) and layered (`axes` set) modes still require `tokens` — the loader has no other starting point. Configs that omit `resolver`, `axes`, AND `tokens` now throw a descriptive error at load time.

- abf657d: CSS emission now keys per-axis instead of per-composed-theme. Multi-axis projects emit one `:root` block carrying the default-tuple values plus one block per non-default cartesian tuple, each keyed on a compound attribute selector in `Project.axes` order (`[data-mode="Dark"][data-brand="Brand A"] { … }`). Every var is redeclared per tuple — flat emission stays correct when axes collide at the same token path (`brand-a.json` overriding `color.sys.surface.default` already set by `mode.dark`), where nested cascading would need cross-axis collision analysis. Single-axis projects (one resolver modifier, or the synthetic `theme` axis) keep the familiar `[data-theme="…"]` shape. `emitCss` takes a new optional `axes` in `EmitCssOptions`; `projectCss` routes `project.axes` in by default.
- c1a8c71: Expose modifier axes as first-class on `Project`. `Project.axes: Axis[]` surfaces each DTCG resolver modifier with its `contexts`, `default`, `description`, and `source` (`'resolver' | 'synthetic'`); projects loaded without a resolver get a single synthetic `theme` axis. A new `permutationID(input)` utility centralizes the tuple-to-string logic previously inlined in the resolver loader — single-axis tuples stringify to the context value; multi-axis tuples join with `·`. The virtual `virtual:swatchbook/tokens` module now also exports `axes`, so toolbar and panel work in follow-up PRs can key on tuples rather than flat theme names.
- 04b3f44: Named tuple presets — `defineSwatchbookConfig({ presets })` now takes an ordered list of `{ name, axes, description? }` entries. Each preset names a partial axis tuple (any axis the preset omits falls back to that axis's `default` when applied). Core validates presets at `loadProject` time: unknown axis keys and invalid context values surface as `warn` diagnostics and are sanitized out, but the preset itself is preserved (an empty preset is still a valid tuple). Project gains a `presets` field, the virtual module gains a `presets` export, and the addon broadcasts presets alongside axes/themes on `INIT_EVENT`. The toolbar renders presets as quick-select pills next to the axis dropdowns: clicking a pill writes the composed tuple into `globals.swatchbookAxes` + `globals.swatchbookTheme`, highlights the pill whose tuple matches the current selection, and shows a subtle modified-marker dot if the user tweaks an axis dropdown after applying a preset.

### Patch Changes

- 4ca9bb3: Align `storybook` peerDependency range on `@unpunnyfuns/swatchbook-addon` with `@unpunnyfuns/swatchbook-blocks` (`^10.3.5`). Consumers pinning Storybook to 10.3.0–10.3.4 previously satisfied the addon floor but failed the blocks floor.
- 1986a0f: Add standard npm publish metadata — `license` (MIT), `repository`, `homepage`, `bugs`, `author`, `keywords` — to all three published packages. No runtime change; required for registry discoverability, npm provenance attestation, and legal clarity ahead of the v0.1.0 release.
