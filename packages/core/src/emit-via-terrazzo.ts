import { pathToFileURL } from 'node:url';
import { build, defineConfig, Logger, type Plugin } from '@terrazzo/parser';
import cssPlugin, { type CSSPluginOptions } from '@terrazzo/plugin-css';
import { makeCSSVar } from '@terrazzo/token-tools/css';
import type { Axis, Project, Theme } from '#/types.ts';

/**
 * Explicit permutation entry for `selection`. `input` is the tuple (any
 * subset of axis names → context values); `name` is optional display metadata
 * downstream emitters may pick up. Matches the shape of `Theme` / `Preset`
 * without forcing consumers to construct a full project type.
 *
 * @internal Used by the addon + integrations for axis-aware emission.
 * Not part of the public API.
 */
export interface EmitSelectionEntry {
  input: Record<string, string>;
  name?: string;
}

/** @internal Options for the addon-internal Terrazzo emission wrapper. */
export interface EmitViaTerrazzoOptions {
  /**
   * Which tuples to fan out across. Defaults to `'themes'` — the full
   * cartesian product every CSS emitter wants for runtime switching. Use
   * `'presets'` for curated named subsets (MUI createTheme, addon-themes
   * config, Vuetify) — declare them via `config.presets`. Or pass an
   * explicit array when you want full control.
   *
   * `'presets'` with no presets declared on the project throws — that's
   * almost always a config mistake, so we surface it loudly instead of
   * silently emitting nothing.
   */
  selection?: 'themes' | 'presets' | readonly EmitSelectionEntry[];
  /**
   * Extra options for `@terrazzo/plugin-css`. `permutations` and
   * `variableName` are managed internally — passing them here is a no-op
   * (the wrapper overrides). Pass `filename`, `include`, `exclude`,
   * `transform`, `utility`, `colorDepth`, etc.
   */
  cssOptions?: Omit<CSSPluginOptions, 'permutations' | 'variableName'>;
  /**
   * Additional Terrazzo plugins to run alongside `plugin-css`. The canonical
   * ones — `plugin-css-in-js`, `plugin-tailwind`, `plugin-swift`,
   * `plugin-js`, `plugin-sass`, `plugin-vanilla-extract`, `plugin-token-listing`
   * — all piggyback on `plugin-css`'s transforms, so `plugin-css` always
   * runs first even if you don't ask for its CSS output (pass `skipBuild`
   * via `cssOptions` to suppress the file).
   */
  plugins?: readonly Plugin[];
}

/** @internal Output file shape from the Terrazzo emission wrapper. */
export interface EmittedFile {
  filename: string;
  contents: string | Uint8Array;
}

/**
 * Run the Terrazzo plugin pipeline against a loaded swatchbook project.
 * Auto-derives per-tuple permutations from `project.themes` (or presets /
 * explicit list), wraps each in our compound `data-*` selector, and pins
 * CSS variable naming to the project's `cssVarPrefix`. Everything else is
 * vanilla Terrazzo — additional plugins you pass receive the pre-computed
 * CSS transforms and emit on top.
 *
 * Throws when called on a project without a retained parser input
 * (layered / plain-parse paths). Resolver-backed projects work out of the
 * box because `loadResolver()` already returns the unified `{ tokens,
 * sources, resolver }` triple we thread onto `Project.parserInput`.
 *
 * @internal Consumers should not depend on this function. It exists for
 * the addon + integrations to drive Terrazzo's plugin pipeline with
 * swatchbook's axis composition. External consumers driving their own
 * build should use Terrazzo's CLI against the DTCG sources directly.
 */
export async function emitViaTerrazzo(
  project: Project,
  options: EmitViaTerrazzoOptions = {},
): Promise<EmittedFile[]> {
  if (!project.parserInput) {
    throw new Error(
      'emitViaTerrazzo: project has no retained Terrazzo parser input. ' +
        'Only resolver-backed projects currently support this call; ' +
        'layered + plain-parse paths are not yet wired.',
    );
  }

  const { tokens, sources, resolver } = project.parserInput;
  const logger = new Logger({ level: 'warn' });
  const cwdURL = pathToFileURL(`${project.cwd}/`);
  const prefix = project.config.cssVarPrefix ?? '';
  const selection = resolveSelection(project, options.selection ?? 'themes');

  // Merge per-call options over the project-wide config. Per-call wins
  // because integrations (Tailwind, css-in-js) may want to override the
  // consumer's global plugin-css shape for their specific emission.
  const mergedCssOptions = { ...project.config.cssOptions, ...options.cssOptions };
  const projectPlugins = project.config.terrazzoPlugins ?? [];
  const extraPlugins = options.plugins ?? [];

  const config = defineConfig(
    {
      plugins: [
        cssPlugin({
          ...mergedCssOptions,
          variableName: (token) =>
            prefix ? makeCSSVar(String(token.id), { prefix }) : makeCSSVar(String(token.id)),
          permutations: selection.map((entry) => ({
            input: entry.input,
            prepare: (css: string) =>
              `${compoundSelector(entry.input, project.axes, prefix)} {\n${css}\n}\n`,
          })),
        }),
        ...projectPlugins,
        ...extraPlugins,
      ],
    },
    { logger, cwd: cwdURL },
  );

  const result = await build(tokens, { config, resolver, sources, logger });
  return result.outputFiles.map((f) => ({ filename: f.filename, contents: f.contents }));
}

/**
 * Compose the compound attribute selector for one tuple. Keeps axis order
 * stable (matches `Project.axes` iteration) so cascade specificity is
 * predictable. Falls back to `:root` for an empty tuple — the default in a
 * single-axis project with no input.
 */
function compoundSelector(
  input: Record<string, string>,
  axes: readonly Axis[],
  prefix: string,
): string {
  const parts: string[] = [];
  for (const axis of axes) {
    const value = input[axis.name];
    if (value === undefined) continue;
    parts.push(`[${attrName(prefix, axis.name)}="${cssEscapeAttr(value)}"]`);
  }
  return parts.length > 0 ? parts.join('') : ':root';
}

function attrName(prefix: string, key: string): string {
  return prefix ? `data-${prefix}-${key}` : `data-${key}`;
}

function cssEscapeAttr(value: string): string {
  return value.replaceAll('\\', '\\\\').replaceAll('"', '\\"');
}

function resolveSelection(
  project: Project,
  selection: NonNullable<EmitViaTerrazzoOptions['selection']>,
): readonly EmitSelectionEntry[] {
  if (selection === 'themes') {
    return project.themes.map((theme: Theme) => ({ input: theme.input, name: theme.name }));
  }
  if (selection === 'presets') {
    if (project.presets.length === 0) {
      throw new Error(
        "emitViaTerrazzo: selection 'presets' requires at least one preset " +
          'declared in config.presets. Got none.',
      );
    }
    return project.presets.map((preset) => ({
      input: fillPresetWithDefaults(preset.axes, project.axes),
      name: preset.name,
    }));
  }
  // Explicit list — caller handles axis filling themselves.
  return selection;
}

/**
 * Presets may omit axes — any axis the preset doesn't name falls back to
 * that axis's own `default`. Matches the toolbar's activation semantics
 * so an emitted entry matches what the user sees when they click a preset
 * pill in Storybook.
 */
function fillPresetWithDefaults(
  presetAxes: Partial<Record<string, string>>,
  axes: readonly Axis[],
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const axis of axes) {
    out[axis.name] = presetAxes[axis.name] ?? axis.default;
  }
  return out;
}
