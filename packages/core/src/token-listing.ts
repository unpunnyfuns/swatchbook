import { pathToFileURL } from 'node:url';
import { build, defineConfig, Logger, type Plugin } from '@terrazzo/parser';
import cssPlugin, { type CSSPluginOptions } from '@terrazzo/plugin-css';
import tokenListingPlugin, {
  type ListedToken,
  type TokenListingPluginOptions,
} from '@terrazzo/plugin-token-listing';
import { makeCSSVar } from '@terrazzo/token-tools/css';
import type { ParserInput } from '#/types.ts';

export type { ListedToken } from '@terrazzo/plugin-token-listing';

/**
 * Token Listing data indexed by path for fast per-token lookup. Each entry
 * is the raw `ListedToken` emitted by `@terrazzo/plugin-token-listing` —
 * `$name`, `$type`, `$value`, `$extensions["app.terrazzo.listing"]` with
 * names / previewValue / originalValue / source.loc.
 *
 * Produced by `computeTokenListing`; attached to `Project.listing` when the
 * project is resolver-backed so downstream consumers can read authoritative
 * CSS var names and preview strings instead of re-deriving them.
 */
export type TokenListingByPath = Record<string, ListedToken>;

/**
 * Run Terrazzo's build pipeline with `plugin-css` + `plugin-token-listing`
 * and parse the resulting listing JSON into a path-indexed map.
 *
 * Reuses the same `plugin-css` variable-naming rule emitViaTerrazzo uses,
 * so the `names.css` field in every entry matches exactly what emission
 * would produce — by construction, no parallel logic to drift.
 *
 * Returns an empty map on any failure (missing listing output, parse
 * error, plugin crash). The caller treats listing data as optional
 * enrichment; losing it shouldn't block `loadProject`.
 */
export interface ComputeTokenListingOptions {
  /** Extra options forwarded to the internal `plugin-css` instance. */
  cssOptions?: Omit<CSSPluginOptions, 'variableName' | 'permutations' | 'filename' | 'skipBuild'>;
  /** Extra options forwarded to the internal `plugin-token-listing` instance. */
  listingOptions?: Omit<TokenListingPluginOptions, 'filename'>;
  /** Extra plugins loaded into the build — referenced by `listingOptions.platforms`. */
  extraPlugins?: readonly Plugin[];
}

export async function computeTokenListing(
  parserInput: ParserInput,
  cwd: string,
  prefix: string,
  options: ComputeTokenListingOptions = {},
): Promise<TokenListingByPath> {
  try {
    const { tokens, sources, resolver } = parserInput;
    const logger = new Logger({ level: 'warn' });
    const cwdURL = pathToFileURL(`${cwd}/`);

    // User-supplied `platforms` overrides the default CSS entry when
    // present — otherwise the built-in `css` platform is the only one
    // registered, matching the earlier default behavior.
    const platforms = options.listingOptions?.platforms ?? {
      css: { name: '@terrazzo/plugin-css', description: 'CSS custom properties' },
    };

    const config = defineConfig(
      {
        plugins: [
          cssPlugin({
            ...options.cssOptions,
            filename: 'tokens.css',
            variableName: (token) =>
              prefix ? makeCSSVar(String(token.id), { prefix }) : makeCSSVar(String(token.id)),
          }),
          ...(options.extraPlugins ?? []),
          tokenListingPlugin({
            ...options.listingOptions,
            filename: 'tokens.listing.json',
            platforms,
          }),
        ],
      },
      { logger, cwd: cwdURL },
    );

    const result = await build(tokens, { config, resolver, sources, logger });
    const listingFile = result.outputFiles.find((f) => f.filename === 'tokens.listing.json');
    if (!listingFile) return {};

    const raw =
      typeof listingFile.contents === 'string'
        ? listingFile.contents
        : new TextDecoder().decode(listingFile.contents);
    const parsed = JSON.parse(raw) as { data?: ListedToken[] };
    if (!Array.isArray(parsed.data)) return {};

    const byPath: TokenListingByPath = {};
    for (const entry of parsed.data) {
      byPath[entry.$name] = entry;
    }
    return byPath;
  } catch {
    return {};
  }
}
