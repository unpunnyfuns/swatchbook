/**
 * Browser-safe theme-enumeration + naming helpers. Exported through the
 * `@unpunnyfuns/swatchbook-core/themes` subpath so the addon's preset
 * codegen, the addon's preview decorator, the MCP server's tuple lookup,
 * and the blocks-side display name share one implementation. Same set
 * of "themes a project surfaces" (default + per-axis singletons +
 * presets) consumers iterate over; same `tupleToName` join everyone
 * uses for the `data-<prefix>-theme` attribute.
 *
 * Pure functions over structural input types — no `Project` import, no
 * Terrazzo parser, no Node deps.
 */

/** One named theme produced by enumeration — the canonical name + the tuple it resolves to. */
export interface ThemeEntry {
  readonly name: string;
  readonly tuple: Readonly<Record<string, string>>;
}

/** Minimal axis shape `enumerateThemes` and `tupleToName` need. */
export interface ThemeEnumAxis {
  readonly name: string;
  readonly default: string;
  readonly contexts: readonly string[];
}

/** Minimal preset shape `enumerateThemes` needs. */
export interface ThemeEnumPreset {
  readonly name: string;
  readonly axes: Partial<Record<string, string>>;
}

/**
 * Synthesize the canonical theme name from a tuple — axis values joined
 * by ` · ` in axis declaration order. Same form `Project.cells` keys
 * against and the `data-<prefix>-theme` attribute holds. Falls back to
 * each axis's `default` when the tuple omits it.
 */
export function tupleToName(
  axes: readonly { readonly name: string; readonly default: string }[],
  tuple: Readonly<Record<string, string>>,
): string {
  return axes.map((a) => tuple[a.name] ?? a.default).join(' · ');
}

/**
 * Enumerate every theme a project surfaces:
 *
 *   1. The default tuple (axes at their defaults), always first.
 *   2. Per-axis non-default singletons (`{...defaults, [axis]: ctx}`)
 *      for each `(axis, non-default-context)` pair.
 *   3. Presets — fill omitted axes from defaults.
 *
 * Deduped by name (presets pointing at a singleton or the default tuple
 * collapse into the singleton entry). Order matches the loader's own
 * singleton enumeration: default → per-axis singletons → presets.
 */
export function enumerateThemes(input: {
  readonly axes: readonly ThemeEnumAxis[];
  readonly presets: readonly ThemeEnumPreset[];
  readonly defaultTuple: Readonly<Record<string, string>>;
}): ThemeEntry[] {
  const out: ThemeEntry[] = [];
  const seen = new Set<string>();

  const push = (tuple: Record<string, string>): void => {
    const name = tupleToName(input.axes, tuple);
    if (seen.has(name)) return;
    seen.add(name);
    out.push({ name, tuple });
  };

  push({ ...input.defaultTuple });
  for (const axis of input.axes) {
    for (const ctx of axis.contexts) {
      if (ctx === axis.default) continue;
      push({ ...input.defaultTuple, [axis.name]: ctx });
    }
  }
  for (const preset of input.presets) {
    const tuple: Record<string, string> = { ...input.defaultTuple };
    for (const [a, c] of Object.entries(preset.axes)) {
      if (c !== undefined) tuple[a] = c;
    }
    push(tuple);
  }

  return out;
}
