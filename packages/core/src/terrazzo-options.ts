import { defineConfig as defineTerrazzoConfig } from '@terrazzo/parser';
import type { Config as TerrazzoConfig, ConfigInit, Logger, Plugin } from '@terrazzo/parser';
import type { CSSPluginOptions } from '@terrazzo/plugin-css';
import type { Diagnostic } from '#/types.ts';

/**
 * CSS plugin options that swatchbook manages internally and strips from
 * the allowed surface. `variableName` and `permutations` are load-bearing
 * for axis-aware emission and prefix handling; `filename` and `skipBuild`
 * would break the in-memory capture the listing pipeline relies on.
 */
export type StrippedCssOption = 'variableName' | 'permutations' | 'filename' | 'skipBuild';

export type ForwardedCssOptions = Omit<CSSPluginOptions, StrippedCssOption>;

// Deprecated plugin-css knobs that are silently inert under swatchbook's
// permutation-based emission. Calling them out as `warn` diagnostics beats
// the alternative — authors wonder why their `modeSelectors` don't take
// effect and blame swatchbook.
const INERT_DEPRECATED_KEYS = ['baseSelector', 'baseScheme', 'modeSelectors'] as const;

/**
 * Validate user-supplied `cssOptions`. The type system already prevents
 * setting the stripped fields; this catches no-ops the type doesn't know
 * about — plugin-css's deprecated mode selectors, superseded by the
 * permutations swatchbook builds per theme.
 */
export function validateCssOptions(raw: ForwardedCssOptions | undefined): {
  diagnostics: Diagnostic[];
} {
  if (!raw) return { diagnostics: [] };

  const diagnostics: Diagnostic[] = [];
  const present = INERT_DEPRECATED_KEYS.filter(
    (key) => (raw as Record<string, unknown>)[key] !== undefined,
  );
  if (present.length > 0) {
    diagnostics.push({
      severity: 'warn',
      group: 'swatchbook/css-options',
      message: `\`cssOptions.${present.join('`, `cssOptions.')}\` ${
        present.length === 1 ? 'is' : 'are'
      } deprecated in @terrazzo/plugin-css and do not apply — swatchbook builds one permutation per resolver theme for axis-aware emission. Remove the setting${
        present.length === 1 ? '' : 's'
      } to silence this diagnostic.`,
    });
  }
  return { diagnostics };
}

/**
 * Terrazzo lint configuration accepted on swatchbook's `Config`. Sourced from
 * Terrazzo's own `Config['lint']` rather than restated, so an upstream shape
 * change surfaces at typecheck rather than at runtime.
 */
export type TerrazzoLintOptions = NonNullable<TerrazzoConfig['lint']>;

/** Inputs to a single `buildParseConfig` call; one per permutation-loader call site. */
export interface BuildParseConfigOptions {
  lintOptions?: TerrazzoLintOptions;
  plugins?: readonly Plugin[];
  logger: Logger;
  cwd: URL;
}

/**
 * Build the Terrazzo config for swatchbook's internal `parse()` passes.
 *
 * Both permutation loaders route through here so the lint configuration —
 * and any future forwarded field — is applied once rather than duplicated
 * per call site. Omitting `lintOptions` yields Terrazzo's recommended rules,
 * which is the long-standing default.
 *
 * `plugins` is forwarded so `lintOptions.rules` can reference a rule
 * registered by a `terrazzoPlugins` entry rather than Terrazzo core — Terrazzo
 * validates rule ids against the loaded plugin set. `parse()` only reads
 * `config.plugins` for its lint pass, so forwarding them here cannot trigger
 * a transform or build hook.
 */
export function buildParseConfig({
  lintOptions,
  plugins,
  logger,
  cwd,
}: BuildParseConfigOptions): ConfigInit {
  return defineTerrazzoConfig(
    {
      ...(lintOptions && { lint: lintOptions }),
      ...(plugins && { plugins: [...plugins] }),
    },
    { logger, cwd },
  );
}
