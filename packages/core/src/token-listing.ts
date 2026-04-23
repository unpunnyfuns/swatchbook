import { pathToFileURL } from 'node:url';
import { build, defineConfig, Logger } from '@terrazzo/parser';
import cssPlugin from '@terrazzo/plugin-css';
import tokenListingPlugin, { type ListedToken } from '@terrazzo/plugin-token-listing';
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
export async function computeTokenListing(
  parserInput: ParserInput,
  cwd: string,
  prefix: string,
): Promise<TokenListingByPath> {
  try {
    const { tokens, sources, resolver } = parserInput;
    const logger = new Logger({ level: 'warn' });
    const cwdURL = pathToFileURL(`${cwd}/`);

    const config = defineConfig(
      {
        plugins: [
          cssPlugin({
            filename: 'tokens.css',
            variableName: (token) =>
              prefix
                ? makeCSSVar(String(token.id), { prefix })
                : makeCSSVar(String(token.id)),
          }),
          tokenListingPlugin({
            filename: 'tokens.listing.json',
            platforms: {
              css: { name: '@terrazzo/plugin-css', description: 'CSS custom properties' },
            },
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
